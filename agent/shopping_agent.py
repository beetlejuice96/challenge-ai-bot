import os
from dotenv import load_dotenv
from typing import Optional, Dict, List
from pydantic import BaseModel, Field, field_validator
import requests
import json
import re
import html
from datetime import datetime

# Imports actualizados para LangChain 2024-2025
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.exceptions import OutputParserException
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState
from langchain_core.tools import ToolException

load_dotenv()

# 1. SCHEMAS ESTRUCTURADOS CON VALIDACIÓN
class ProductSearchParams(BaseModel):
    """Schema para parámetros de búsqueda de productos"""
    # keyword: str = Field(description="Término de búsqueda principal, si usas el resto de los campos, este se ignora.")
    category: Optional[str] = Field(default=None, description="Categoría del producto (ej: clothing, electronics)")
    color: Optional[str] = Field(default=None, description="Color del producto")
    size: Optional[str] = Field(default=None, description="Talla del producto")
    name: Optional[str] = Field(default=None, description="Nombre del producto(ej: pantaolon, camisa, short)")
    min_price: Optional[float] = Field(default=None, description="Precio mínimo")
    max_price: Optional[float] = Field(default=None, description="Precio máximo")
    page: Optional[int] = Field(default=1, description="Página para paginación")
    
    # @field_validator('keyword')
    # @classmethod
    # def validate_keyword(cls, v):
    #     if not v or not v.strip():
    #         raise ValueError("La keyword no puede estar vacía")
    #     # Sanitizar entrada
    #     v = re.sub(r'[<>"\'\\]', '', v)
    #     v = html.escape(v)
    #     return v.strip()
    
    @field_validator('page')
    @classmethod
    def validate_page(cls, v):
        if v is not None and v < 1:
            raise ValueError("La página debe ser mayor a 0")
        return v

class ShoppingSessionState(MessagesState):
    """Estado extendido para la sesión de compras"""
    search_history: List[Dict] = []
    user_preferences: Dict = {}
    active_filters: Dict = {}
    cart_id: Optional[str] = None
    session_context: Dict = {}
    remaining_steps: int = 0

# 2. MAPEO SEMÁNTICO Y NORMALIZACIÓN
class EntityMapper:
    """Mapea variaciones lingüísticas a valores estándar"""
    
    COLOR_MAPPING = {
        "rojo": "red", "azul": "blue", "verde": "green",
        "negro": "black", "blanco": "white", "gris": "gray",
        "amarillo": "yellow", "rosa": "pink", "morado": "purple"
    }
    
    SIZE_MAPPING = {
        "chico": "S", "pequeño": "S", "small": "S",
        "mediano": "M", "medium": "M",
        "grande": "L", "large": "L",
        "extra grande": "XL", "extra-grande": "XL"
    }
    
    CATEGORY_MAPPING = {
        "ropa": "clothing", "vestimenta": "clothing",
        "pantalones": "clothing", "camisas": "clothing",
        "zapatos": "footwear", "calzado": "footwear",
        "electrónicos": "electronics", "tecnología": "electronics"
    }
    
    @classmethod
    def normalize_color(cls, color: str) -> str:
        return cls.COLOR_MAPPING.get(color.lower(), color.lower())
    
    @classmethod
    def normalize_size(cls, size: str) -> str:
        return cls.SIZE_MAPPING.get(size.lower(), size.upper())
    
    @classmethod
    def normalize_category(cls, category: str) -> str:
        return cls.CATEGORY_MAPPING.get(category.lower(), category.lower())

# 3. HERRAMIENTAS CON DECORADOR @tool Y MANEJO DE ERRORES
@tool(args_schema=ProductSearchParams)
def search_products( category: str = None, name:str = None, color: str = None, 
                   size: str = None, min_price: float = None, 
                   max_price: float = None, page: int = 1) -> str:
    """
    Busca productos en el backend con filtros avanzados.
    Soporta paginación y múltiples filtros simultáneos.
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    try:
        # Normalizar entidades usando el mapper
        # if color:
        #     color = EntityMapper.normalize_color(color)
        # if size:
        #     size = EntityMapper.normalize_size(size)
        # if category:
        #     category = EntityMapper.normalize_category(category)
        
        # Construir parámetros
        params = {
            # "keyword": keyword,
            "category": category,
            "color": color,
            "size": size,
            "name": name,
            # "min_price": min_price,
            # "max_price": max_price,
            # "page": page,
            # "limit": 10  # Límite por página
        }
        
        # Filtrar parámetros None
        params = {k: v for k, v in params.items() if v is not None}
        
        # Llamada con timeout y retry
        response = requests.get(
            f"{backend_url}/products/search",
            params=params,
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        print(f"Request URL: {response.url}")  # Debugging: Ver URL completa de la solicitud
        
        response.raise_for_status()
        
        data = response.json()
        
        # Formatear respuesta estructurada
        if data.get('data'):
            products = []
            for item in data['data']:
                # Cada producto tiene variants, tomamos el primer variant para mostrar info básica
                variant = item.get('variants', [{}])[0] if item.get('variants') else {}
                product_info = {
                    'id': item.get('id'),
                    'name': item.get('name', 'Sin nombre'),
                    'category': item.get('category', ''),
                    'description': item.get('description', ''),
                    'color': variant.get('color', ''),
                    'size': variant.get('size', ''),
                    'price': variant.get('price50U', 'N/A'),
                    'stock': variant.get('stock', 0)
                }
                products.append(f"• {product_info['name']} (ID: {product_info['id']}) - ${product_info['price']} - {product_info['category']}")
            
            # Información de paginación según example.json
            meta = data.get('meta', {})
            total_pages = meta.get('pageCount', 1)
            current_page = meta.get('page', 1)
            item_count = meta.get('itemCount', 0)
            
            result = f"Productos encontrados ({item_count} resultados):\n"
            result += "\n".join(products)
            result += f"\n\nPágina {current_page} de {total_pages}"
            
            if meta.get('hasNextPage'):
                result += f"\n💡 Hay más resultados. Puedes pedir 'siguiente página' para ver más."
            
            return result
        else:
            return f"No se encontraron productos con los filtros especificados."
            
    except requests.exceptions.Timeout:
        raise ToolException("La búsqueda tardó demasiado. Intenta de nuevo.")
    except requests.exceptions.ConnectionError:
        raise ToolException("No se pudo conectar al servidor. Verifica tu conexión.")
    except requests.exceptions.HTTPError as e:
        raise ToolException(f"Error del servidor: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado en la búsqueda: {str(e)}")

@tool
def get_product_details(product_id: str) -> str:
    """
    Obtiene detalles completos de un producto específico.
    Incluye descripción, especificaciones, disponibilidad y reseñas.
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    try:
        response = requests.get(
            f"{backend_url}/products/{product_id}",
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        product = response.json()
        
        # Formatear información completa
        details = f"""
📦 **{product.get('name', 'Sin nombre')}**
📂 Categoría: {product.get('category', 'N/A')}
📋 Descripción: {product.get('description', 'Sin descripción')}

🎽 **Variantes disponibles:**
"""
        
        # Parsear variants correctamente
        variants = product.get('variants', [])
        if variants:
            # Agrupar por talla y color para mostrar disponibilidad
            available_variants = []
            unavailable_variants = []
            
            for variant in variants:
                variant_info = f"  • Talla {variant.get('size', 'N/A')} - {variant.get('color', 'N/A')} - ${variant.get('price50U', 'N/A')} - Stock: {variant.get('stock', 0)}"
                
                if variant.get('isAvailable', False) and variant.get('stock', 0) > 0:
                    available_variants.append(variant_info + " ✅")
                else:
                    unavailable_variants.append(variant_info + " ❌")
            
            if available_variants:
                details += "\n🟢 **Disponibles:**\n" + "\n".join(available_variants)
            
            if unavailable_variants:
                details += "\n\n🔴 **No disponibles:**\n" + "\n".join(unavailable_variants)
        else:
            details += "\nNo hay variantes disponibles"
        
        print(details)
        return details.strip()
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise ToolException(f"No se encontró el producto con ID {product_id}")
        else:
            raise ToolException(f"Error obteniendo producto: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado obteniendo producto: {str(e)}")

@tool
def create_cart() -> str:
    """
    Crea un nuevo carrito de compras para el usuario.
    Retorna el ID del carrito creado.
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    try:
        response = requests.post(
            f"{backend_url}/carts",
            json={'created_at': datetime.now().isoformat()},
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        cart_data = response.json()
        cart_id = cart_data.get('id')
        
        return f"🛒 ¡Carrito creado exitosamente! ID: {cart_id}\nYa puedes empezar a agregar productos."
        
    except requests.exceptions.HTTPError as e:
        raise ToolException(f"Error creando carrito: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado creando carrito: {str(e)}")

@tool
def add_item_to_cart(cart_id: str, product_variant_id: int, qty: int = 1) -> str:
    """
    Agrega un item específico al carrito usando el ID de la variante del producto.
    
    Args:
        cart_id: ID del carrito
        product_variant_id: ID de la variante del producto a agregar
        qty: Cantidad del producto (por defecto 1)
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    if not cart_id:
        raise ToolException("Necesitas proporcionar un cart_id válido.")
    
    try:
        response = requests.post(
            f"{backend_url}/carts/{cart_id}/items",
            json={
                'product_variant_id': product_variant_id,
                'qty': qty
            },
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        return f"✅ Item agregado al carrito ID {cart_id}: Variante {product_variant_id} (cantidad: {qty})"
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise ToolException("Carrito o variante de producto no encontrada")
        else:
            raise ToolException(f"Error agregando item al carrito: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado agregando item: {str(e)}")

@tool
def update_cart_item(cart_id: str, item_id: int, qty: int) -> str:
    """
    Actualiza la cantidad de un item específico en el carrito.
    
    Args:
        cart_id: ID del carrito
        item_id: ID del item en el carrito(es el id del cart-item, no del product-variant)
        qty: Nueva cantidad del item
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    if not cart_id:
        raise ToolException("Necesitas proporcionar un cart_id válido.")
    
    try:
        response = requests.patch(
            f"{backend_url}/carts/{cart_id}/items/{item_id}",
            json={'qty': qty},
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        return f"✅ Item actualizado en carrito ID {cart_id}: Item {item_id} ahora tiene cantidad {qty}"
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise ToolException("Carrito o item no encontrado")
        else:
            raise ToolException(f"Error actualizando item: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado actualizando item: {str(e)}")

@tool
def update_cart_metadata(cart_id: str, cart_data: dict) -> str:
    """
    Actualiza los metadatos del carrito (no los items).
    
    Args:
        cart_id: ID del carrito
        cart_data: Datos del carrito a actualizar (ej: metadatos, fechas, etc.)
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    if not cart_id:
        raise ToolException("Necesitas proporcionar un cart_id válido.")
    
    try:
        response = requests.patch(
            f"{backend_url}/carts/{cart_id}",
            json=cart_data,
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        return f"✅ Carrito ID {cart_id} actualizado correctamente"
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise ToolException("Carrito no encontrado")
        else:
            raise ToolException(f"Error actualizando carrito: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado actualizando carrito: {str(e)}")

@tool
def get_cart_details(cart_id: str) -> str:
    """
    Obtiene el estado completo y detallado del carrito de compras.
    Incluye todos los items, cantidades, precios y totales.
    
    Args:
        cart_id: ID del carrito a consultar
    """
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    
    if not cart_id:
        raise ToolException("Necesitas proporcionar un cart_id válido.")
    
    try:
        response = requests.get(
            f"{backend_url}/carts/{cart_id}",
            timeout=10,
            headers={'User-Agent': 'Shopping-Agent/1.0'}
        )
        response.raise_for_status()
        
        cart_data = response.json()
        
        # Formatear información detallada del carrito
        if not cart_data.get('cartItems'):
            return f"🛒 El carrito ID {cart_id} está vacío."
        
        cart_details = f"""
🛒 **Carrito ID {cart_id}:**
- Total de items: {len(cart_data.get('cartItems', []))}
- Items detallados:"""
        
        total_value = 0
        for item in cart_data.get('cartItems', []):
            variant = item.get('productVariant', {})
            product = variant.get('product', {})
            item_total = float(variant.get('price50U', 0)) * item.get('qty', 0)
            total_value += item_total
            
            cart_details += f"""
  • {product.get('name', 'Producto')} (ID: {product.get('id', 'N/A')})
    Variante: Talla {variant.get('size', 'N/A')} - Color {variant.get('color', 'N/A')}
    Cantidad: {item.get('qty', 0)} × ${variant.get('price50U', 'N/A')} = ${item_total:.2f}"""
        
        cart_details += f"\n\n💰 **Total estimado: ${total_value:.2f}**"
        
        # Agregar contexto completo para el agente
        cart_details += f"\n\n🔍 **Datos completos del carrito:** {json.dumps(cart_data, indent=2)}"
        
        return cart_details
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise ToolException("Carrito no encontrado")
        else:
            raise ToolException(f"Error obteniendo carrito: {e.response.status_code}")
    except Exception as e:
        raise ToolException(f"Error inesperado obteniendo carrito: {str(e)}")

# 4. AGENTE MEJORADO CON LANGGRAPH
class ShoppingAgent:
    def __init__(self):
        # Configurar LLM con parámetros optimizados
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv('GEMINI_API_KEY'),
            temperature=0.1,  # Baja temperatura para determinismo
            max_tokens=2048,
            top_p=0.8,
            top_k=40
        )
        
        # Configurar memoria persistente
        self.memory = MemorySaver()
        
        # Crear herramientas
        self.tools = [
            search_products,
            get_product_details,
            create_cart,
            add_item_to_cart,        # Nueva herramienta
            update_cart_item,        # Nuev herramienta  
            update_cart_metadata,     # Nueva herramienta
            get_cart_details
        ]
        
        # Crear agente con LangGraph
        self.agent = create_react_agent(
            self.llm,
            self.tools,
            checkpointer=self.memory,
            state_schema=ShoppingSessionState
        )
        
        # ID de sesión para memoria persistente
        self.session_id = "shopping_session_1"
        
    def _update_session_context(self, state: ShoppingSessionState, 
                              user_message: str) -> ShoppingSessionState:
        """Actualiza el contexto de la sesión con información relevante"""
        
        # Agregar a historial de búsqueda
        state.search_history.append({
            "query": user_message,
            "timestamp": datetime.now().isoformat(),
            "context": state.session_context
        })
        
        # Extraer preferencias del usuario
        if "color" in user_message.lower():
            colors = ["rojo", "azul", "verde", "negro", "blanco"]
            for color in colors:
                if color in user_message.lower():
                    state.user_preferences["preferred_color"] = color
        
        if "talla" in user_message.lower() or "size" in user_message.lower():
            sizes = ["S", "M", "L", "XL"]
            for size in sizes:
                if size in user_message.upper():
                    state.user_preferences["preferred_size"] = size
        
        return state
    
    def chat(self, message: str) -> str:
        """
        Procesa un mensaje del usuario con contexto mejorado
        """
        try:
            # Configurar thread para memoria persistente
            config = {"configurable": {"thread_id": self.session_id}}
            
            # Procesar mensaje con el agente
            response = self.agent.invoke(
                {"messages": [HumanMessage(content=message)]},
                config=config
            )
            
            # Extraer respuesta del agente
            if response and "messages" in response:
                last_message = response["messages"][-1]
                if hasattr(last_message, 'content'):
                    return last_message.content
            
            return "Lo siento, no pude procesar tu mensaje correctamente."
            
        except OutputParserException as e:
            return f"Hubo un problema interpretando tu mensaje: {str(e)}"
        except Exception as e:
            return f"Error procesando tu mensaje: {str(e)}"
    
    def get_session_info(self) -> dict:
        """Retorna información de la sesión actual"""
        try:
            config = {"configurable": {"thread_id": self.session_id}}
            state = self.agent.get_state(config)
            return {
                "session_id": self.session_id,
                "message_count": len(state.values.get("messages", [])),
                "last_activity": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e)}

# 5. EJEMPLO DE USO CON MANEJO DE ERRORES
if __name__ == "__main__":
    print("🤖 Agente de compras con LangChain mejorado iniciado!")
    print("✨ Funciones disponibles:")
    print("   • Búsqueda inteligente de productos")
    print("   • Manejo de sinónimos y variaciones")
    print("   • Filtros avanzados (color, talla, precio)")
    print("   • Paginación automática")
    print("   • Gestión de carritos")
    print("   • Memoria conversacional")
    print("\nEscribe 'salir' para terminar, 'info' para ver estado de sesión.\n")
    
    try:
        agent = ShoppingAgent()
        
        while True:
            user_input = input("Tú: ").strip()
            
            if user_input.lower() in ['salir', 'exit', 'quit']:
                print("¡Hasta luego!")
                break
            
            if user_input.lower() == 'info':
                info = agent.get_session_info()
                print(f"📊 Info de sesión: {info}\n")
                continue
            
            if not user_input:
                continue
                
            response = agent.chat(user_input)
            print(f"Agente: {response}\n")
            
    except KeyboardInterrupt:
        print("\n¡Hasta luego!")
    except Exception as e:
        print(f"Error iniciando el agente: {e}")
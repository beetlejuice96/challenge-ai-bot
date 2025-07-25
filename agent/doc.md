# Como empezar a codear en este repo

- entrar al entorno virtual con `source agent_env/bin/activate`

- instalar las dependencias con `pip install -r requirements.txt`

- crear un archivo `.env` con las siguientes variables de entorno:

```
GEMINI_API_KEY=tu_api_key_aqui
BACKEND_URL=http://localhost:3000
```

TODO:

[x] arreglar el endpoint `/search` porque esta tiendo erroes con el atributo `skip`

update: todavia sigo tratando de hacer que funcione la busqueda por productos. al parecer es mas complejo poder hacer que la llm use filtros de busqueda. estoy investigando con claude.

update: ahora tengo que arreglar la manera en que parseo el json de respuesta, tambien tengo que entender el nuevo codigo del agente v2. esete se creo con research de claude.

---

ahora lo unico que tengo es que tiene problemas al agregar y quitar cosas del carrito.
agrego una falda en vez de un pantalon que le pedi y tampoco sabe como eliminar un item del carrito.

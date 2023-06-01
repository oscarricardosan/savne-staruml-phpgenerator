1. Para evitar que un paquete sea usado en el namespace de una clase, 
puede cambiar la propiedad visibility de un paquete a private. 
Con ello será excluida del path de la ruta, esto no la retira de los componentes a 
escanear.

## Tipos de asociación

* type.UMLAssociation: solo agrega el use en la clase padre, especificando la instancia de clase que se va a usar.
* type.UMLInterfaceRealization: agrega el implement a nivel de clase, hacía la interfaz que implementa.
* type.UMLGeneralization: agrega el extends de la clase a la que hereda.
* type.UMLDependency: especifica las clases que van a ser inyectadas por el construct__.
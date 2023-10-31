# Savne-PHP

**Savne-Php** is a package created by employees of
[Savne SAS](https://savne.net) and free to use by anyone.

This package is made up of a series of tools that will allow programmers
PHP get the juice out of the StarUml tool.

---

## PHP Generator

The PHP Generator tool allows you to generate the php code of a project from a diagram
of UML classes.

### USE

Generate code from a package: this option allows us to generate the code of all the classes, interface,
data types and relationships.

1. Click on the menu Tools/Savne PHP/Generate Code from Package.
2. Select the code package you want to generate.
3. Select the folder in which the code will be exported.

Generate code from a class: this option will generate the code of the desired class together with its respective
folder structure.

1. Click on the menu Tools/Savne PHP/Generate Code from Class.
2. Select the package that will serve as the root for the code namespace.
3. Select the class that will be exported.
4. Select the folder where the code will be exported.

Generate code from an interface: this option will only generate the respective code of the selected class, however,
will use as namespace the selected initial package.

1. Click on the menu Tools/Savne PHP/Generate Code from Interface.
2. Select the package that will serve as the root for the code namespace.
3. Select the interface that will be exported.
4. Select the folder where the code will be exported.


### CONFIGURATION OPTIONS

* **Indent Spaces:** Number of spaces for indentation
* **Dependency injection type:** Specifies the type of dependency injection to use in the class,
  * Constructor parameters
   ```php
    public function __construct(
        protected $repo      
    ){
      ....  
    } 
    ```
  * Constructor body
   ```php
    protected $repo;
    public function __construct(){
      $this->repo= new Repo();
    } 
    ```
  * Not injec
* **Use specification as method code:** Use the content of the specification field, in an operation as code within the method.
   ```php
    public function sum(
        $num1, $num2
    ){
      $your_code= $num1 + $num2;
      return $your_code * 5;
    } 
    ```
* **Use documentation as comment code:** Use the content of the documentation field as a comment for methods or properties.
  ```php
    /**
     * This function should work for 
     * environments multi countries, in 3 different  
     * development environments and applying chemical principles >-<
     **/
    public function sum(
        $num1, $num2
    ){
      /** YODO: Your code */
    } 
    ```
* **Generate PHPDoc:** Generate standard phpdoc.
     ```php
       /**
        * $var $num1
        * $var $num2
        **/
       public function sum(
          $num1, $num2
       )
       {
          /** YODO: Your code */
       }
    ```


### CONVENTIONS

* If you want a package to be omitted and not part of the class namespace
  change the visibility type to `private`.

* The names of the interfaces will be renamed like this:
    * RepositoryInterface by Repo. Example: UserRepositoryInterface=> $userRepo
    * Interface by ''. Example: UserServiceInterface=> $userService

* If the class ends with the name **Test** and has methods that start with is_, add the comment test
* 
```
class PrinterTest
{
    /**
     * @test
     */
     public function is_sum_working(){
        ...
     }
     
} 
```

### RELATIONSHIP TYPES

The type of relationship implemented will influence the code as follows:

* UMLAssociation: add `use` from the parent class to the child class, indicating the namespace of the class to use.
* UMLInterfaceRealization: in the target class add `implement` of the related interface.
* UMLGeneralization: in the child class it will add the respective `extends` and `use` of the parent class.
* UMLDependency: in the parent class the respective `inject` will be added to the construct__.
---

## PHP Importer

The PHP Importer tool generates a class diagram based on an existing php project.

### USE

Import a project: This option imports the classes, interfaces, data types, relationships and folder structure based on an existing project.

1. Click on the menu Tools/Savne PHP/Import.
2. Select the project you want to import.
3. Select the starUML package where you want to import the project.
4. Wait until the project is imported (It may take a while).

Import a class: this option only imports a class with its directory structure. 

1. Click on the menu Tools/Savne PHP/Import Class.
2. Select the class you want to import.
3. Select the StartUML package where you want to import the class.
4. Wait until the class is imported.
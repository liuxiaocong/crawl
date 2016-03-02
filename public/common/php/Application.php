<?php
/**
 * Created by PhpStorm.
 * User: xiaocong
 * Date: 27/6/14
 * Time: 6:35 PM
 */
class Application{
    protected $config;

    public $src = __DIR__;
    static private $_instance = NULL;

    private function __construct($config) {
        if($config){
            $this->config = $config;
            $this->src = $config->src;
        }
//        $this->loadClass();
        spl_autoload_register(function($class) {
            $pathLibs = dirname(__FILE__) . '/' . $class . '.php';
            $pathContorllers = $this->src . '/controller/' . $class . '.php';
            $pathModels = $this->src . '/model/' . $class . '.php';

            if (file_exists($pathLibs)) {
                require_once $pathLibs;
            }else if (file_exists($pathContorllers)) {
                require_once $pathContorllers;
            }  elseif (file_exists($pathModels )) {
                require_once $pathModels ;
            }
        });
    }

    private function __clone() {}

    static public function getInstance($config=null) {
        if (is_null(self::$_instance) || !isset(self::$_instance)) {
            self::$_instance = new self($config);
        }
        return self::$_instance;
    }

    public function getConfig($attr){
        return $this->config->$attr;
    }


//    private function loadClass(){
//        require_once dirname(__FILE__) . '/Util.php';
//        require_once dirname(__FILE__) . '/BaseController.php';
//        require_once $this->src . '/controller/ViewController.php';
//        require_once $this->src . '/controller/ApiController.php';
//    }

    public function start(){
        $c =  trim(isset($_GET['controller'])? $_GET['controller'] : "View" );
        $a =  trim(isset($_GET['action'])? $_GET['action']: "index");
        $controllerClass = ucfirst($c) . "Controller";
        $action = "action" . ucfirst($a);
        $c = new $controllerClass();
        $c -> $action();
    }

    public function getViewDir(){
        return $this->src . '/view';
    }
}
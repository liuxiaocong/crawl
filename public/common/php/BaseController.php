<?php
/**
 * Created by PhpStorm.
 * User: xiaocong
 * Date: 25/6/14
 * Time: 1:01 PM
 */

class BaseController {
    public $layout = false;

    public function render($view, $modal){
        extract($modal);
        ob_start();
        include(Application::getInstance()->getViewDir().'/' . $view . '.php');
        $content = ob_get_contents();
        ob_end_clean();
        return $content;
    }
} 
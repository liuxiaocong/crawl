<?php
class LogManager
{
    // public static $logger;

    public static function log($method, $parameter, $result, $level) {
    	$loc =  'log/pkhero'.date('Ymd').'.log';
    	$cnt = date('Y-m-d H:i:s') . ' [' . $level . ']' . '[' . $method . ']' . '[' . $parameter . ']' . $result.PHP_EOL;
        // error_log(date('Y-m-d H:i:s') . ' [' . $level . ']' . '[' . $method . ']' . '[' . $parameter . ']' . $result.PHP_EOL, 3, $loc);
        // file_put_contents($loc, $cnt, FILE_APPEND | LOCK_EX);
        $f = fopen($loc, 'a');
		fwrite($f, $cnt);
		fclose($f);
    }
}
?>
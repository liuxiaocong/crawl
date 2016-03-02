<?php

class Util
{
    public static function sendUrlPostJson($url, $data, $timeoutMs = 30000)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data))
        );
        curl_setopt($ch, CURLOPT_HEADER, true);
        $response = curl_exec($ch);
        $err = curl_errno($ch);
        $errmsg = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $header = self::get_headers_from_curl_response($response);
        if (isset($header['http_code']) && $header['http_code'] == "HTTP/1.1 200 OK") {
            if (isset($header['x-pk-ret'])) {
                $content = "{\"status\": 0,\"code\":" . $header['x-pk-ret'] . "}";
            } else {
                $content = substr($response, $header_size);
            }
        } else {
            $content = "{\"status\": 0}";
        }
        curl_close($ch);
        return $content;
    }

    public static function sendUrlPostJsonWithoutRs($url, $data, $timeoutMs = 30000)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data))
        );
        curl_setopt($ch, CURLOPT_HEADER, true);
        $response = curl_exec($ch);
        $err = curl_errno($ch);
        $errmsg = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $header = self::get_headers_from_curl_response($response);
        if (isset($header['http_code']) && $header['http_code'] == "HTTP/1.1 200 OK") {
            $content = "{\"status\": 1}";
        } else {
            $content = "{\"status\": 0}";
        }
        curl_close($ch);
        return $content;
    }

    private static function get_headers_from_curl_response($response)
    {
        $headers = array();
        $header_text = substr($response, 0, strpos($response, "\r\n\r\n"));

        foreach (explode("\r\n", $header_text) as $i => $line)
            if ($i === 0)
                $headers['http_code'] = $line;
            else {
                list ($key, $value) = explode(': ', $line);

                $headers[$key] = $value;
            }

        return $headers;
    }

    public static function sendUrlGet($url, $timeoutMs = 10000)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $result = curl_exec($ch);
        curl_close($ch);

        return $result;
    }

    public static function sendUrlGetHeadEv($url, $headEv, $timeoutMs = 10000)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'X-Nokia-Msisdn: ' . $headEv
        ));
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }


    public static function readRawPost()
    {
        return file_get_contents("php://input");
    }

    public static function readJsonPost()
    {
        return json_decode(file_get_contents("php://input"));
    }

    public static function getParameter($pname, $default = NULL)
    {
        if (isset($_GET[$pname]) && $_GET[$pname] != "") {
            return $_GET[$pname];
        } else if (isset($_POST[$pname]) && $_POST[$pname] != "") {
            return $_POST[$pname];
        }
        return $default;
    }

    public static function accessDeny()
    {
        header('HTTP/1.1 403 Access Deny'); //This may be put inside err.php instead
//        $_GET['e'] = 403; //Set the variable for the error code (you cannot have a
        header('Location: /events/whatsappevent/error.php?errCode=403');
        exit;
    }

    public static function sendJson($obj)
    {
        header("Content-type:application/json;");
        echo json_encode($obj);
        exit;
    }
}
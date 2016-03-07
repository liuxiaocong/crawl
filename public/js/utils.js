/*
 * webview base liblary
 *
 */
var utils = utils || {}
utils = (function (exports) {
    var exports = exports || {};

    /*
     * ECMA5 bind polifill
     */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {
                },
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    var getPlatform = exports.getPlatform = function () {
        var ua = navigator.userAgent.toLowerCase();
        if (/iP(od|hone|ad)/i.test(ua)) {
            return "ios";
        } else if (/android/i.test(ua)) {
            return "android";
        } else {
            return "others";
        }
    };
    /*http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line*/
    exports.TemplateEngine = function (html, options) {
        //(.+?)  or  <%([^%>]+)?%>
        var re = /\[#(.+?)#\]/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0;
        var add = function (line, js) {
            js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        }
        while (match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
    }

    exports.log_server = function _log(obj) {
        if (!obj) {
            return obj;
        }
        var img = document.createElement('img');
        var url = "/log.do?";
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                url += (key + "=" + encodeURIComponent(obj[key]) + "&");
            }
        }
        if (url.substr(-1) === "&")
            url = url.substr(0, url.length - 1);
        img.src = url;
        img.onload = function () {
            console.log('log to server: ', url);
        };
    };
    /*
     * open url in a iframe, mainly used for communication with ios webview.
     */


    exports.get = function (cfg) {
        return exports.ajax(cfg.url, cfg.cb, cfg.method, cfg.post, cfg.contenttype, cfg.timeout);
    };

    exports.ajax = exports.tinyxhr = function (url, cb, method, post, contenttype, timeout) {
        var requestTimeout, xhr, timeout = timeout || 16000;
        try {
            xhr = new XMLHttpRequest();
        } catch (e) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                if (console)
                    console.log("tinyxhr: XMLHttpRequest not supported");
                return null;
            }
        }
        requestTimeout = setTimeout(function () {
            xhr.abort();
            if (requestTimeout) {
                cb(new Error("tinyxhr: aborted by a timeout", 998), "", xhr);
            }
        }, timeout);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4)
                return;
            clearTimeout(requestTimeout);
            requestTimeout = null;
            cb(xhr.status !== 200 ? new Error("tinyxhr: server respnse status is " + xhr.status) : xhr.responseText, xhr);
        };

        xhr.open(method ? method.toUpperCase() : "GET", url, true);

        //xhr.withCredentials = true;

        if (!post)
            xhr.send();
        else {
            console.log(post);
            xhr.setRequestHeader('Content-type', contenttype ? contenttype : 'application/x-www-form-urlencoded');
            xhr.send(post);
        }
    }

    exports.getURLParameter = function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    };

    exports.clickDownloadHandle = function () {
        var flag = /MicroMessenger/i.test(navigator.userAgent) || /Weibo/i.test(navigator.userAgent);
        var client = "unknow";
        if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
            client = "ios";
        } else if (/(Android)/i.test(navigator.userAgent)) {
            client = "android";
        }
        if (!flag) {
            try {
                if (client == "android") {
                    window.location = "https://play.google.com/store/apps/details?id=mozat.instamob";
                } else {
                    window.location = "https://play.google.com/store/apps/details?id=mozat.instamob";
                }
            } catch (e) {

            }
            window.setTimeout(function () {
                window.location = "https://play.google.com/store/apps/details?id=mozat.instamob";
            }, 1000)
        } else {
//            try {
//                if (client == "android") {
//                    window.location = "https://play.google.com/store/apps/details?id=mozat.instamob";
//                }
//            } catch (e) {
//
//            }
            window.setTimeout(function () {
                window.location = "/download";
                mquery("#mob").get(0).style.display = "block";
            }, 10)
        }
    };

    exports.whenReady = (function () {
        var funcs = [];    // The functions to run when we get an event
        var ready = false; // Switches to true when the handler is triggered

        // The event handler invoked when the document becomes ready
        function handler(e) {
            // If we've already run once, just return
            if (ready) return;

            // If this was a readystatechange event where the state changed to
            // something other than "complete", then we're not ready yet
            if (e.type === "readystatechange" && document.readyState !== "complete")
                return;

            // Run all registered functions.
            // Note that we look up funcs.length each time, in case calling
            // one of these functions causes more functions to be registered.
            ///sadfasfds
            //adsfasfdsa
            if (funcs && funcs.length) {
                for (var i = 0; i < funcs.length; i++) {
                    if (!ready) {
                        funcs[i].call(document);
                    }
                }
            }
            // Now set the ready flag to true and forget the functions
            ready = true;
            funcs = [];
        }

        // Register the handler for any event we might receive
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", handler, false);
            document.addEventListener("readystatechange", handler, false);
            window.addEventListener("load", handler, false);
        }
        else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", handler);
            window.attachEvent("onload", handler);
        }

        // Return the whenReady function
        return function whenReady(f, priv) {
            if (ready) {
                f.call(document);
            } // If already ready, just run it
            else {
                if (priv)
                    funcs.unshift(f);
                else
                    funcs.push(f);
            }          // Otherwise, queue it for later.
        };
    }());

    exports.extend = function (x, y) {
        for (var i in y) {
            if (y.hasOwnProperty(i)) {
                x[i] = y[i];
            }
        }
        return x;
    };
    ;
    return exports;
})(utils);

/*
 * webview js bridge, support inmediate return and asyncronize call.
 * Bridge.openApp({
 * callback: function(err, data){
 *  console.log(err, data)
 * }
 * });
 *
 *
 */
/* small jquery syntax like utils */
var mquery = (function (utils) {
    var query = function (selectorOrElement) {
        var elements = [];
        if (typeof selectorOrElement === "string") {
            elements = document.querySelectorAll(selectorOrElement);
        } else if (selectorOrElement.toString() === "[object NodeList]") {
            elements = selectorOrElement;
        }
        else if (selectorOrElement.querySelectorAll) {
            elements = [selectorOrElement];
        }
        var mquery = new Lquery(elements);
        return mquery;
    };

    function Lquery(elements) {
        this.elements = elements;
        utils.extend(this, {
            getAll: function () {
                return this.elements;
            },
            val: function (v) {
                if (v !== undefined) {
                    this.elements[0].value = v;
                    return this;
                }
                return this.elements[0].value;
            },
            attr: function (key, value) {
                if (value !== undefined) {
                    this.elements[0].setAttribute(key, value);
                    return this;
                }
                return this.elements[0].getAttribute(key);
            },
            data: function (key, value) {
                if (value !== undefined) {
                    this.elements[0].setAttribute('data-' + key.toLowerCase(), value);
                    return this;
                }
                return this.elements[0].getAttribute('data-' + key.toLowerCase());
            },
            css: function (key, value) {
                if (value !== undefined) {
                    for (var i = 0; i < this.elements.length; i++) {
                        this.elements[i].style[key] = value;
                    }
                    return this;
                }
                return this.elements[0].style[key];
            },
            count: function () {
                return this.elements.length;
            },
            get: function (index) {
                return this.elements[index || 0];
            },
            find: function (selector) {
                return query(this.elements[0].querySelectorAll(selector));
            },
            remove: function () {
                for (var i = 0; i < this.elements.length; i++) {
                    var elem = this.elements[i];
                    elem.parentNode.removeChild(elem);
                }
                return this;
            },
            append: function (html) {
                if (typeof html === "string") {
                    var child = document.createElement('div');
                    child.innerHTML = html.trim();
                    child = child.firstChild;
                    this.elements[0].appendChild(child);
                } else if (html) {
                    this.elements[0].appendChild(html);
                }

                return this;
            },
            html: function (arg) {
                if (this.elements.length < 1) {
                    if (!arg) {
                        return "";
                    } else {
                        return this;
                    }
                }
                if (arg !== undefined) {
                    for (var i = 0; i < this.elements.length; i++) {
                        this.elements[i].innerHTML = arg;
                    }
                } else {
                    return this.elements[0].innerHTML;
                }
                return this;
            },
            appendText: function (arg) {
                for (var i = 0; i < this.elements.length; i++) {
                    this.elements[i].innerHTML = this.elements[i].innerHTML + arg;
                }
                return this;
            },
            empty: function () {
                for (var i = 0; i < this.elements.length; i++) {
                    this.elements[i].innerHTML = "";
                }
                return this;
            },
            hasClass: function (arg, index) {
                var i = index || 0;
                return (" " + this.elements[i].className.split(/\s+/g).join(" ") + " ").indexOf(" " + arg + " ") > -1;
            },
            addClass: function (arg) {
                for (var i = 0, len = elements.length; i < len; i++) {
                    var targets = arg.split(/\s+/g);
                    for (var j = 0; j < targets.length; j++) {
                        if (!this.hasClass(targets[j], i)) {
                            elements[i].className += " " + targets[j];
                        }
                    }
                }
                return this;
            },
            removeClass: function (arg) {

                var classes,
                    i = 0, j = 0, k = 0, len = elements.length, num;
                var targets = arg.split(/\s+/g);
                for (i = 0; i < len; i++) {
                    classes = elements[i].className.split(/\s+/g);
                    for (j = 0, num = targets.length; j < num; j++) {
                        for (k = 0; k < classes.length; k++) {
                            if (classes[k] === targets[j]) {
                                classes.splice(k, 1);
                                break;
                            }
                        }
                    }
                    elements[i].className = classes.join(" ");
                }
                return this;
            },
            /*
             * Note: keep parameter has some bug, need to track why remove listener not working.
             */
            bind: function (event, callback, remove) {
                var delegate = function () {
                    callback && callback.apply(this, arguments);
                };
                for (var i = 0; i < this.elements.length; i++) {
                    var el = this.elements[i], h;
                    if (remove && el['handlers_' + event]) {
                        for (var j = 0; j < el['handlers_' + event].length; j++) {
                            h = el['handlers_' + event][j];
                            el.removeEventListener(event, h, false);
                        }
                        el['handlers_' + event] = null;
                    }
                    el.addEventListener(event, delegate, false);
                    if (!el['handlers_' + event]) {
                        el['handlers_' + event] = [delegate];
                    } else {
                        el['handlers_' + event].push(delegate);
                    }
                }
                return this;
            },
            each: function (callback) {
                for (var i = 0; i < this.elements.length; i++) {
                    callback.call(this.elements[i], i);
                }
                return this;
            },
            hide: function (doNotchangeDisplay) {
                for (var i = 0; i < this.elements.length; i++) {
                    this.elements[i].style.height = 0;
                    this.elements[i].style.opacity = 0;
                    if (!doNotchangeDisplay) {
                        this.elements[i].style.display = 'none';
                    }
                }
                return this;
            },
            show: function (display) {
                var display = display || 'block';
                for (var i = 0; i < this.elements.length; i++) {
                    this.elements[i].style.display = display;
                    this.elements[i].style.height = "auto";
                    this.elements[i].style.opacity = 1;
                }
                return this;
            },
            showWithTime: function (time) {
                var elements = this.elements;
                if (elements[0].style.opacity >= 1) return;
                this.slock || (function (time) {
                    this.slock = true;
                    var speed = 1 / (time / 20);
                    var currentOp = 0;
                    this.process = setInterval(function () {
                        currentOp += speed;
                        for (var i = 0; i < elements.length; i++) {
                            elements[i].style.opacity = currentOp + speed;
                        }
                        if (currentOp >= 1) {
                            this.process = null;
                            this.slock = false;
                        }
                    }, 50);
                }(time));
                return this;
            }
        });
        return this;
    }

    return query;
})(utils);



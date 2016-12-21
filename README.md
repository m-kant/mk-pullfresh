mkPullFresh
===========
Pull to refresh jQuery plugin for mobile and desktop with CSS animation. Extremely simple usage. Asynchronous stop. Fully customizable. Material design included.

[Demo](http://mkant.ru/mink-js/mk-pullfresh)


Including in browser
-----------

Include script and style sheet into your page:
```HTML
<script src="path/to/plugin/mk-pullfresh.min.js"></script>
<link  href="path/to/plugin/mk-pullfresh.min.css" rel="stylesheet">
```

Basic usage
-----------

Initialize mkPullFresh on element you want to pull by one of the ways:
```JavaScript
// no args, pending state will be 1 second long
$('.pulled').mkPullFresh(); 

// with refresh callback with one arg 'end' - function to stop pending when you need.
$('.pulled').mkPullFresh(function(end){
    // some code, may be async
	...
    end(); // stop pending state of pull indicator
  });

// with options. Refresh function can be passed as 'refresh' parameter
$('.pulled').mkPullFresh(options);

// both refresh function and options given
$('.pulled').mkPullFresh(refresh,options);

```

[Details and Demo](http://mkant.ru/mink-js/mk-pullfresh)
--------------------------------------------------------

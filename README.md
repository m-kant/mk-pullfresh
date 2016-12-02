mkPullFresh
===========
Pull to refresh jQuery plugin for mobile and desktop with CSS animation. Extremely simple usage. Asynchronous stop. Fully customizable. Material design included.

[Demo](http://mkant.ru/mink-js/mk-pullfresh)


Basic usage
-----------

Include script and style sheet into you page:
```HTML
<script src="path/to/plugin/mk-pullfresh.min.js" type="text/javascript"></script>
<link  href="path/to/plugin/mk-pullfresh.min.css" rel="stylesheet">
```

Then initialize mkPullFresh on element you want to pull by one of the ways:
```JavaScript
// no args, pending state will be 1 second long
$('.pulled').mkPullFresh(); 

// with refresh callback with one arg - 'end' function to stop pending when you need.
$('.pulled').mkPullFresh(function(end){
    // some code, may be async
	...
    end(); // stop pending state of pull indicator
  });

// with options, refresh function can be passed in 'refresh' parameter
$('.pulled').mkPullFresh(options);

// both refresh function and options given
$('.pulled').mkPullFresh(refresh,options);

```

[Details and Demo](http://mkant.ru/mink-js/mk-pullfresh)

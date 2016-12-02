/*
 mk-pullfresh - pull to refresh jQuery plugin for touch and mouse devices
 by Kantemiriov Mihail
 some ideas was taken from xpull and jquery.p2r

 Usage:

 $('.selector').mkPullFresh(refreshFunction); // one arg of refreshFunction is a end() callback, 'this' - is a plugin instance
 $('.selector').mkPullFresh(options);
 $('.selector').mkPullFresh(refreshFunction,options);
 $('.selector').mkPullFresh(command); // 'get' - to get plugin instance, 'destroy' - to unibnd all listeners

 Example:

$('.selector').mkPullFresh(function(end){
	// do something
	end();
});

 Options:

{
	maxShift:		100,	// maximum available shift
	readyShift:		80,		// shift to be ready for refresh
	pendingShift:	60,		// shift of bubble in pending state
	refresh:		null,	// callback or milliseconds to stop pending refresh(end)
							// where end is a function to be called after refresh finish to reset puller
							// this arg - is a plugin instance
	indicatorHtml:	''		// html code for indicator
	emitEvents:		false	// if true, will emit following events on puller:
							//  mkPullFreshStart(jqEvent,yShift,plugin),
							//  mkPullFreshPull(jqEvent,yShift,plugin), on move
							//  mkPullFreshPending(jqEvent,end,plugin), on refreshing, waiting for the end
							//  mkPullFreshEnd(jqEvent,plugin)
							//  jqEvent - jQuery event, yShift - is a y-axis offset, plugin - is a plugin instance
}

 Commands:

 get
 var mkPullFreshInstance = $('selector').mkPullFresh('get');

 destroy
 $('selector').mkPullFresh('destroy');

*/
;
(function($, window, document) {

	var namespace = 'mkPullFresh';
	var defaults = {
			maxShift: 100, // maximum available shift of pulled element
			readyShift: 60, // shift of pulled element to be ready for refresh
			refresh: null, // callback
			pendingShift: 60,
			indicatorHtml: '<div class="mkpf-envelop"><div class="mkpf-indicator-wrapper"><div class="mkpf-indicator"><div class="mkpf-icon-wrapper"><i class="mkpf-arrow-down"></i></div><i class="mkpf-spinner"></i></div></div></div>',
			emitEvents: false
		};

	var _supportTouch =  (window.Modernizr && Modernizr.touch === true) || (function () {
			'use strict';
			return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
		})();

	/**
	 * adds namespaces to event names
	 * namespace is a jquery trick to easily unbind events for plugins
	 * @param {string} name
	 * @returns {string}
	 */
	var _ns = function(name){
		return name+'.'+namespace;
	};

   // events names with namespaces based on browser support
	var _domEvent  = (function () {
		var events = {
			start: _ns('mousedown'),
			move: _ns('mousemove'),
			end: _ns('mouseup')
		};

		if (_supportTouch) {
			var events = {
				start: _ns('touchstart'),
				move: _ns('touchmove'),
				end: _ns('touchend')
			};
		}else if (!!(window.navigator.msPointerEnabled)) {
			events = {
				start: _ns('MSPointerDown'),
				move: _ns('MSPointerMove'),
				end: _ns('MSPointerUp')
			};
		}else if (!!(window.navigator.pointerEnabled)) {
			events = {
				start: _ns('pointerdown'),
				move: _ns('pointermove'),
				end: _ns('pointerup')
			};
		}

		return events;

	})();


	/**
	 * @constructor
	 * @param {DOMElement} element
	 * @param {function} refresh
	 * @param {object} options
	 * @returns {jQuery}
	 */
	function Plugin (element, refresh, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);
		this.options.refresh = refresh;

		// find dom elements
		this.$puller = $(this.element);
			this.puller = this.element;
		this.$container = this.$puller.parent();
		this.$bubble = $('<div class="mk-pullfresh-bubble">').prependTo(this.$puller);
			this.$bubble.append(this.options.indicatorHtml);
			this.bubble = this.$bubble.get(0);

		this.$container.css({
			'-webkit-overflow-scrolling': 'touch',
			'overflow-scrolling': 'touch'
		});

		this.offset = {
			// contianer relative to document. Exist mobile bug: if page is refreshing
			// with scrolled top - container offset is not correctly recognized
			containerToDoc: this.$container.offset().top,
			pullerToContainer: this.$container.position().top
		};

		// flags
		this.pointer = {
			start:null,
			y:null,
			shift:null
		};

		this.elast = true;

		// set event listeners
		this.$puller.unbind(_domEvent.start);
		this.$puller.on(_domEvent.start, _onStart.bind(this));
		this.$puller.unbind(_domEvent.end);
		this.$puller.on(_domEvent.end, _onEnd.bind(this) );
	}

	Plugin.prototype = {
		pullStart: function(pixels){
			this.puller.setAttribute('data-mkpf-state','active');
			this.bubble.style.height = pixels+'px';

			if(this.options.emitEvents) this.$puller.trigger('mkPullFreshStart',[pixels,this]);
		},
		pullProgress: function(pixels){
			var state = (pixels>this.options.readyShift)?'ready':'active';
			this.puller.setAttribute('data-mkpf-state',state);

			if(pixels>this.options.maxShift) pixels = this.options.maxShift;
			if(pixels<0) pixels = 0;
			this.bubble.style.height = pixels+'px';

			if(this.options.emitEvents) this.$puller.trigger('mkPullFreshPull',[pixels,this]);
		},

		pullPending: function(pixels){
			this.puller.setAttribute('data-mkpf-state','pending');
			this.bubble.style.height = (this.options.pendingShift || 50)+'px';
			this.pending = true;

			if(this.options.emitEvents) this.$puller.trigger('mkPullFreshPending',[this.pullEnd.bind(this),this]);
		},
		pullEnd: function(){
			this.bubble.style.height = '0px';
			this.puller.setAttribute('data-mkpf-state','idle');
			this.pending = false;

			$(document.body).unbind(_domEvent.move);

			if(this.options.emitEvents) this.$puller.trigger('mkPullFreshEnd',this);
		},

		/**
		 *
		 * @param {TouchEvent|MouseEvent} ev
		 * @returns {number}
		 */
		pointerY: function(ev){
			var evCommonType = ev.type.substr(0,5);
			var y;
			if('touch' === evCommonType){
				y  = (ev.targetTouches || ev.originalEvent.targetTouches)[0].pageY;
			}else if('mouse'){
				y  = (ev.pageY || ev.clientY);
			}else{
				console.error('unknown event '+ev.type);
			}
			return y;
		},

		// destroy
		destroy: function () {
			this.puller.removeAttribute('data-mkpf-state');

			// off listener
			this.$puller.off(_domEvent.start);
			this.$puller.off(_domEvent.move);
			this.$puller.off('touchend.' + namespace);
			$(document.body).off(_domEvent.move);

			this.$puller.removeData('plugin_' + namespace);
		}
	};


	function PluginCommand($element,command){
		if($element.length !==1 )throw new Error("Command call on set of elements. Only one element must be in set.");

		var plugin = $element.data('plugin_' + namespace);
		if(!plugin) throw new Error('Command call on non mkPullFresh element');

		if('destroy' === command){
			plugin.destroy();
		}else if('get' === command){
			return(plugin);
		}
	};

	var _onStart = function(ev){
		if (this.pending) { return false; }
		// don't listen if top of container is above the edge of document
		if(this.offset.containerToDoc < $(document).scrollTop()) return true;
		// don't listen if top of puller is above the edge of container
		if(this.offset.pullerToContainer < this.$container.scrollTop()) return true;

		this.pointer.start = this.pointer.y = this.pointerY(ev);
		this.pointer.shift = 0;

		// start to listen moving
		this.$puller.unbind(_domEvent.move);
		this.$puller.on(_domEvent.move, _onMove.bind(this));

		this.pullStart(this.pointer.shift);
	};

	/**
	 *
	 * @param {TouchEvent|MouseEvent} ev
	 * @this {mkPullFresh}
	 * @returns {undefined}
	 */
	var _onMove = function(ev) {
		this.pointer.y = this.pointerY(ev);
		this.pointer.shift = this.pointer.y - this.pointer.start;

		// move under the top
		if (this.pointer.shift > 1) {
			if (this.elast) {
				$(document.body).on(_domEvent.move, function(e) {
					e.preventDefault();
				});
				this.elast = false;
			}

			this.pullProgress(this.pointer.shift);

		// move higher then top
		} else {
			$(document.body).unbind(_domEvent.move);
			this.elast = true;
		}
	};

	var _onEnd = function () {
		var self = this;

		// stop listening moving
		this.$puller.unbind(_domEvent.move);

		if (this.pointer.shift > 0) {
			if (this.pointer.shift > this.options.readyShift) {
				this.pullPending( this.pointer.shift );
				// refresh callback given
				if('function' === typeof this.options.refresh){
					this.options.refresh.call( this, this.pullEnd.bind(this) );
				// delay given istead of callback
				}else if('number' === typeof this.options.refresh){
					setTimeout( this.pullEnd.bind(this), this.options.refresh );
				// no delay, no callback, no events - stop automatically
				}else if(!this.options.emitEvents){
					setTimeout( this.pullEnd.bind(this), 1000 );
				}else{
					// end() must be called from mkPullFreshPending event
				}

			} else {
				this.pullEnd( this.pointer.shift );
			}
		}

		this.pointer.start = this.pointer.y = this.pointer.shift = null;

		// reset
		setTimeout(function() {
			$(document.body).unbind(_domEvent.move);
			self.elast = true;
		}, 300);
	};


	// ASSIGN jQuery plugin
	$.fn[namespace] = function(refreshCallback,options) {
		// COMMAND
		if('string' === typeof refreshCallback){
			return PluginCommand(this,refreshCallback);

		// only options given
		}else if('object' === typeof refreshCallback){
			options = refreshCallback;
			refreshCallback = options.refresh;
		}
		// INITIALIZATION
		return this.each(function() {
			if (!$.data(this, 'plugin_' + namespace)) {
				$.data(this, 'plugin_' + namespace, new Plugin(this, refreshCallback,options));
			}
		});
	};

})(jQuery, window, document);

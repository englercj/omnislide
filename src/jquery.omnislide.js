////
//Events:
// - transition-before  - Data Passed: { index: 'current slide index', next: 'index of next slide' }
// - transition-after   - Data Passed: { index: 'current slide index' }
// - thumb-mouseenter   - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - thumb-mouseleave   - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - thumb-click        - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - nav-mouseenter     - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - nav-mouseleave     - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - nav-click          - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - slide-mouseenter   - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
// - slide-mouseleave   - Data Passed: { originalEvent: 'original event var', target: 'DOM target' }
//monkey wrench to make older versions of jQuery compatible
$.isNumeric = function (n) { return !isNaN(parseFloat(n)) && isFinite(n); };

//////////////////////////////////////
// Vars global to ALL slider instances
//////////////////////////////////////
var defaults = {
    slides: undefined,          //pass either xml string, xmlDocument, ul (DOM), ul (jQuery), ul (string jQuery selector)
    startSlide: 0,              //initial slide for the plugin to start displaying (0 based)
    theme: '',                  //theme for this slider
    transition: {
        duration: 800,          //the duration of the animation for each box of the transition
        wait: 2000              //the wait time to show each slide
    },
    timer: {
        visible: true,          //show canvas timer?
        height: 40,             //height of the timer
        width: 40,              //width of the timer
        border: 2,              //space between filled and empty colors on the timer
        colors: {
            empty: 'rgba(30, 30, 30, 0.8)',     //color to show on unfilled time
            filled: 'rgb(255, 255, 255)'  //color to show as ellapsed time
        },
        ringThickness: 4,       //width of the timer ring (filled, so not including border)
        type: 'ring',           //type of the timer; circle, ring, bar
        animAsOverlay: true,    //animate as overlay on slide (hide on transition, show on return)
        animationIn: false,     //custom animation to use for animating the timer into the slide
        animationOut: false     //custom animation to use for animating the timer out of the slide
    },
    navigation: {
        visible: true,          //enable navigation?
        fadeOnHover: true,      //fade out nav when hovered out
        animAsOverlay: true,    //animate as overlay on slide (hide on transition, show on return)
        animationIn: false,     //custom animation to use for animating the navigation into the slide
        animationOut: false     //custom animation to use for animating the navigation out of the slide
    },
    thumbs: {
        visible: true,          //enable thumbnails?
        slideOn: 'click',
        animAsOverlay: false,   //animate as overlay on slide (hide on transition, show on return)
        animationIn: false,     //custom animation to use for animating the navigation into the slide
        animationOut: false     //custom animation to use for animating the navigation out of the slide
    },
    title: {
        visible: true,          //enable slide titles?
        animAsOverlay: true,    //animate as overlay on slide (hide on transition, show on return)
        animationIn: false,     //custom animation to use for animating the title into the slide
        animationOut: false     //custom animation to use for animating the title out of the slide
    },
    overlay: {
        visible: true,          //enable slide overlay?
        animAsOverlay: true,    //animate as overlay on slide (hide on transition, show on return)
        animationIn: false,     //custom animation to use for animating the overlay into the slide
        animationOut: false     //custom animation to use for animating the overlay out of the slide
    },
    slideOverrides: {
        //These slide options override the given values in settings
        //you specify the index of the slide it overrides as the key
        //and the object is a full settings object just like you passed
        //above, you can override anything you want here.

        //Can't Override:
        // - slides
        // - startSlide
        // - theme
    },
    hoverPause: true            //pause when a user hovers into the current slide
},
storage = {
    settings: {},
    sliders: {},
    slideIndexes: {}
};

//time to do the electric slide....
function electricSlide(method) {
    //////////////////////////////////////
    // Variables used throughout plugin
    //////////////////////////////////////
    var settings = {},
    guid = $.OmniSlide.generateGuid(),
    slides = [],
    slider = {
        $container: $(),
        $wrapper: $(),
        $slider: $(),
        $nav: $(),
        $timer: $(),
        $thumbs: $(),
        $slides: $(),
        $dataElm: $(),
        dataElmVisible: false,
        sliding: false,
        timer: false
    },

    slideIndex,

    //////////////////////////////////////
    // Public Plugin Methods
    //////////////////////////////////////
    methods = {
        //initialize the slider plugin
        init: function (options) {
            return this.each(function () { //ensures chainability
                if (options) $.extend(true, settings, defaults, options);

                //place guid where plugins can get at it
                settings.timer.guid = guid;
                settings.transition.guid = guid;

                //parse out the slides into usable data
                var parse = parseSlides();
                if (parse) {
                    $.OmniSlide.error('Error while parsing slides: ', parse);
                    $.OmniSlide.error('settings.slides: ', settings.slides);

                    return false;
                }

                //build out slider HTML
                buildSlider(this);

                //setup slide Index and start transition timer
                slideIndex = -1;
                moveSlide(settings.startSlide);

                //fade out the navigation
                if(settings.navigation.fadeOnHover) slider.$nav.hide();

                //store for retreival by methods
                $(this).data('guid', guid);
                storage.settings[guid] = settings;
                storage.sliders[guid] = slider;
                
                return true;
            });
        },
        //changes an option to the given value
        //and/or returns value given by that option
        option: function (option, value) {
            if (loadStorage(this)) {
                if ($.type(option) == 'string') {
                    var levels = option.split('.'),
                    opt = settings,
                    i = levels.length - 1,
                    key;

                    while (i--) opt = opt[levels.shift()];
                    key = levels.shift();

                    if (value === undefined) return opt[key];

                    if ($.isPlainObject(value))
                        $.extend(true, opt[key], value);
                    else {
                        opt[key] = value;
                        //if they update theme, we need to change classes
                        if (key == 'theme') slider.$wrapper.find('*').andSelf().removeClass(settings.theme).addClass(value);
                    }
                }
            }

            return this;
        },
        //public wrapper around private moveSlide function
        gotoSlide: function (slide) {
            if (loadStorage(this)) { moveSlide(slide); }

            return this;
        },
        nextSlide: function () { return methods.gotoSlide(); },
        previousSlide: function () { return methods.gotoSlide(true); },
        pause: function () { if (loadStorage(this)) { pauseTimer(true); } return this; },
        play: function () { if (loadStorage(this)) { playTimer(true); } return this; },
        //public wrapper for animating the overlays
        showOverlays: function () {
            if (loadStorage(this)) { showOverlays(slideIndex); }

            return this;
        },
        hideOverlays: function () {
            if (loadStorage(this)) { hideOverlays(slideIndex); }

            return this;
        },
        //reverses everything the initialization did
        //should put a user back to the state they were in
        //before calling this plugin
        destroy: function () {
            if (loadStorage(this)) {
                //remove slider and show the dataElment if it was visible before
                slider.$wrapper.remove();
                if (slider.dataElmVisible) slider.$dataElm.show();

                //reset & delete timer, GC should then pick it up
                slider.timer.reset();
                delete slider.timer;

                //reset storage variables
                storage.settings[guid] = {};
                storage.sliders[guid] = {};
                storage.slideIndexes[guid] = 0;
            }

            return this;
        }
    };

    //////////////////////////////////////
    // Transition Handler
    //////////////////////////////////////
    function moveSlide(slide) {
        if (slider.sliding) return false;

        slider.sliding = true;
        var nextSlide, sets;

        //if number go to that slide
        if ($.isNumeric(slide))
            nextSlide = (slide < slider.$slides.length && slide > -1) ? slide : 0;
        //true means move backwards once
        else if (slide === true)
            nextSlide = (slideIndex - 1 < 0) ? slider.$slides.length - 1 : slideIndex - 1;
        //otherwise move forward once
        else
            nextSlide = (slideIndex + 1) % slider.$slides.length;

        sets = checkOverrides(nextSlide);

        slider.$container.trigger('transition-before', [{ index: slideIndex, next: nextSlide}]);

        if (slideIndex === -1) {
            slider.$slides.eq(nextSlide).show();
            slider.$thumbs.eq(nextSlide).addClass('active');

            transitionCallback(nextSlide);
            return true;
        }

        //hide the overlays and do transition on callback
        hideOverlays(slideIndex, function () {
            slider.$thumbs.eq(slideIndex).removeClass('active');
            slider.$thumbs.eq(nextSlide).addClass('active');

            //activate the transition and show overlays on callback
            $.OmniSlide.transitionAPI.transition(sets.transition, slider.$slides,
                                                     slideIndex, nextSlide, function () { transitionCallback(nextSlide); });
        });

        function transitionCallback(nextSlide) {
            slideIndex = nextSlide;
            storage.slideIndexes[guid] = slideIndex;
            remakeTimer();

            slider.$timer.data('skip-anim', slider.timer.locked && slider.timer.stopped());
            showOverlays(slideIndex, function () {
                slider.sliding = false;
                slider.$timer.data('skip-anim', false);
                if (sets.navigation.fadeOnHover && !slider.$slider.data('hovered')) slider.$nav.fadeOut();
                playTimer();
                slider.$container.trigger('transition-after', [{ index: slideIndex}]);
            });
        }
        
        return true;
    }

    //////////////////////////////////////
    // Utilities
    //////////////////////////////////////

    //for checking if the current slide has setting overrides
    function checkOverrides(slide) {
        //if no slide passed, use slideIndex
        slide = slide || slideIndex;

        //lose original setting reference
        var sets = $.extend(true, {}, settings);

        //if there is an override, perform it
        if (sets.slideOverrides[slide]) $.extend(true, sets, sets.slideOverrides[slide]);

        //return possibly overriden settings
        return sets;
    }

    //load up the stored values for the slider we are operating on
    // (methods called with $().OmniSlide('...') aren't in closure scope)
    function loadStorage($elm) {
        guid = $elm.data('guid');

        if (!guid) {
            $.OmniSlide.error('Unable to load from storage, element is not a slider: ', this);
            return false;
        }

        settings = storage.settings[guid];
        slider = storage.sliders[guid];
        slideIndex = storage.slideIndexes[guid];

        return true;
    }

    //exec animations on slide overlays, custom or default
    function animateOverlays(i, show, cb) {
        var $overlay = slider.$slides.eq(i).find('div.slide-overlay'),
        $title = slider.$slides.eq(i).find('h1.slide-title'),
        extFunc, intFunc, overlayWait, sets = checkOverrides(i);

        if (show) {
            extFunc = 'animationIn';
            intFunc = 'fadeIn';
        } else {
            extFunc = 'animationOut';
            intFunc = 'fadeOut';
        }

        slider.timer.stop();

        doAnimOverlay(sets.timer, slider.$timer);
        doAnimOverlay(sets.navigation, slider.$nav);
        doAnimOverlay(sets.thumbs, slider.$thumbs);
        doAnimOverlay(sets.title, $title);
        doAnimOverlay(sets.overlay, $overlay);

        function doAnimOverlay(obj, $obj) {
            if (obj.visible && obj.animAsOverlay && $obj.length && !$obj.data('skip-anim')) {
                if (obj[extFunc] && $.isFunction(obj[extFunc])) obj[extFunc].call($obj);
                else $obj[intFunc]('slow');
            }
        }

        overlayWait = setInterval(function () {
            //wait until animations finish
            if (slider.$timer.is(':animated') || slider.$nav.is(':animated') || slider.$thumbs.is(':animated') ||
                $overlay.is(':animated') || $title.is(':animated')) return;

            //animations done
            clearInterval(overlayWait);

            if (cb) cb();
        }, 50);
    }

    //animateOverlays wrappers
    function hideOverlays(i, cb) { return animateOverlays(i, false, cb); }
    function showOverlays(i, cb) { return animateOverlays(i, true, cb); }

    //pauses the timer with optional hard lock
    function pauseTimer(hard) {
        if (slider.sliding) return false;

        if (slider.timer.stop() !== false && hard) {
            slider.$nav.find('.slide-nav-pause').removeClass('slide-nav-pause').addClass('slide-nav-play');
            slider.$timer.stop(true).fadeTo('slow', 0);
            slider.timer.lock();
            
            return true;
        }
        
        return false;
    }

    //plays the timer optionaly a hard break of the lock
    function playTimer(hard) {
        if (slider.sliding) return false;
        if (hard) slider.timer.unlock();

        if (slider.timer.start() !== false && hard) {
            slider.$nav.find('.slide-nav-play').removeClass('slide-nav-play').addClass('slide-nav-pause');
            slider.$timer.stop(true).fadeTo('slow', 1);
            
            return true;
        }
        
        return false;
    }

    //this will set overriden settings onto the timer
    function remakeTimer() {
        var sets = checkOverrides(),
            state = slider.timer.state();

        slider.timer = new $.OmniSlide.timer(sets.transition.wait, sets.timer, moveSlide, slider.$timer[0]);
        slider.timer.state(state);
    }

    //////////////////////////////////////
    // Event Handlers
    //////////////////////////////////////

    //handles all events on Thumbnails
    function thumbEvent(e) {
        if (e.type == settings.thumbs.slideOn) {
            moveSlide(slider.$thumbs.index(this));
        }

        slider.$container.trigger('thumb-' + e.type, [{ originalEvent: e, target: this}]);
    }

    //handles all events on Slides
    function slideEvent(e) {
        var sets = checkOverrides();

        switch (e.type) {
            case 'mouseenter':
                if (slider.sliding) break;
                if (sets.hoverPause) pauseTimer();
                slider.$slider.data('hovered', true);
                slider.$nav.stop(true).fadeTo('slow', 1);
                break;
            case 'mouseleave':
                if (slider.sliding) break;
                playTimer();
                slider.$slider.data('hovered', false);
                slider.$nav.stop(true).fadeTo('slow', 0);
                break;
        }
        slider.$container.trigger('slide-' + e.type, [{ originalEvent: e, target: this}]);
    }

    //handles all events on Navigation
    function navEvent(e) {
        var sets = checkOverrides();

        if (e.type == 'click') {
            //case 'click':
            var ctrl = $.trim(this.className);

            if (ctrl.indexOf('slide-nav-back') > -1) {
                moveSlide(true);
            } else if (ctrl.indexOf('slide-nav-forward') > -1) {
                moveSlide();
            } else if (ctrl.indexOf('slide-nav-play') > -1) {
                playTimer(true);
            } else if (ctrl.indexOf('slide-nav-pause') > -1) {
                pauseTimer(true);
            }
            //break;
        }
        slider.$container.trigger('nav-' + e.type, [{ originalEvent: e, target: this}]);
    }

    //////////////////////////////////////
    // Parsers and HTML Builders
    //////////////////////////////////////

    //parses the slide input into a normalized format
    function parseSlides() {
        var data = settings.slides, $data;

        if (!data) return 'settings.slides is not defined!';

        if ($.type(data) == 'string') {
            //if its a string it must be either a selector
            //or xml data, lets try to parse the xml and if
            //we fail lets assume its a selector
            try {
                $data = $($.parseXML(data));
            } catch (error) {
                $data = $(data);
            }
        } else if ($.type(data) == 'object') {
            //if its an object then it is either a DOM object,
            //an xmlDocument, or a jQuery object. In any of these
            //cases we need to just wrap it in a jQuery object
            //(Wrapping a jQuery object again just clones it)
            $data = $(data);
        }

        //parse as ul data
        if ($data.is('ul')) {
            $data.find('> li').each(function (i, slide) {
                var $slide = $(slide);
                slides.push({
                    title: $slide.attr('title'),
                    thumb: $slide.find('img.slide-thumb').attr('src'),
                    image: $slide.find('img.slide-image').attr('src'),
                    content: $slide.find('div.slide-content').html(),
                    overlay: $slide.find('div.slide-overlay').html()
                });
            });
            slider.dataElmVisible = $data.is(':visible');
            slider.$dataElm = $data.hide();
        }
        //parse as xml data
        else if ($data.find('slides > slide').length > 0) {
            $data.find('slides > slide').each(function (i, slide) {
                var $slide = $(slide);
                slides.push({
                    title: $slide.attr('title'),
                    thumb: $slide.attr('thumb'),
                    image: $slide.attr('image'),
                    content: $slide.find('content').text(),
                    overlay: $slide.find('overlay').text()
                });
            });
        }

        if (slides.length === 0)
            return 'settings.slides is either an invalid type or formatted incorrectly.';

        return false;
    }

    //builds out the slider's HTML
    function buildSlider(container) {
        //initialize container
        slider.$container = $(container);

        //create wrapper
        slider.$wrapper = $('<div id="' + guid + '" class="slide-wrapper"/>')
            .delegate('div.slide-box', 'hover', slideEvent)
            .delegate('div.slide-nav-control', 'click', navEvent)
            .appendTo(slider.$container);

        if (settings.thumbs.slideOn) slider.$wrapper.delegate('div.slide-thumb', settings.thumbs.slideOn, thumbEvent);

        //create slider box
        slider.$slider = $('<div class="slide-box"/>').appendTo(slider.$wrapper);

        //create navigation
        slider.$nav = $('<div class="slide-nav"/>').toggle(settings.navigation.visible).appendTo(slider.$slider);

        slider.$nav.append('<div class="slide-nav-control slide-nav-back">&nbsp;</div>');
        slider.$nav.append('<div class="slide-nav-control slide-nav-pause">&nbsp;</div>');
        slider.$nav.append('<div class="slide-nav-control slide-nav-forward">&nbsp;</div>');

        //create timer
        slider.$timer = $('<canvas class="slide-timer"/>').toggle(settings.timer.visible).appendTo(slider.$slider);
        slider.timer = new $.OmniSlide.timer(settings.transition.wait, settings.timer, moveSlide, slider.$timer[0]);

        //create thumbnail wrapper
        var $tWrap = $('<div class="slide-thumbs-wrapper"/>').toggle(settings.thumbs.visible).appendTo(slider.$wrapper);

        //create slides and thumbs
        $.each(slides, function (i, slide) {
            //create slide
            var $slide = $('<div class="slide"/>'),
            $thumb = $('<div class="slide-thumb"/>');

            //add slide content
            if (slide.image)
                $slide.css('background-image', 'url(' + slide.image + ')');
            if (slide.content)
                $slide.append($('<div class="slide-content">' + slide.content + '</div>'));
            if (slide.title)
                $slide.append($('<h1 class="slide-title" style="display:none;">' + slide.title + '</h1>'));
            if (slide.overlay)
                $slide.append($('<div class="slide-overlay" style="display:none;">' + slide.overlay + '</div>'));


            //add thumbnail
            $thumb.append('<img class="slide-thumb-image" src="' + slide.thumb + '" alt=""/>');
            $thumb.append('<span class="slide-thumb-title">' + slide.title + '</span>');

            slider.$thumbs = slider.$thumbs.add($thumb);
            slider.$slides = slider.$slides.add($slide.hide());
        });
        slider.$slides.appendTo(slider.$slider);
        slider.$thumbs.appendTo($tWrap);

        //add theme class
        slider.$wrapper.find('*').andSelf().addClass(settings.theme);
    }

    //////////////////////////////////////
    // Method Calling Logic
    //////////////////////////////////////

    if (methods[method]) {
        return methods[method].apply(this, [].slice.call(arguments, 1));
    } else if (!method || $.type(method) == 'object') {
        return methods.init.apply(this, arguments);
    } else {
        $.error('Method "' + method + '" does not exist in jQuery.slide');
        return this;
    }
}

//////////////////////////////////////
// OmniSlide canvas timer
//////////////////////////////////////
function electricTimer(animLen, options, callback, canvas) {
    if (!canvas)
        canvas = document.createElement('canvas');

    //init canvas
    canvas.height = options.height;
    canvas.width = options.width;

    var ctx = canvas.getContext('2d'),

    cW = canvas.width,
    cH = canvas.height,

    midX = cW / 2,
    midY = cH / 2,

    timeEllapsed = 0,

    //radianStart = Math.PI - 0.5,
    radianMax = Math.PI * 2,
    radius = cW / 2,
    lastRad = 0,

    border = options.border,

    tickLoop = null,

    FPS_RATES = [90, 45, 30],
    PAINT_TIME = 3,
    fps_rate = 0,
    framerate = 1E3 / FPS_RATES[fps_rate],

    //paint background
    bgPaint = function () {
        clearCanvas();
        if (!options.visible) return;

        ctx.fillStyle = options.colors.empty;
        ctx.strokeStyle = options.colors.empty;

        switch (options.type) {
        case 'bar':
            clearCanvas();
            ctx.fillRect(0, 0, cW, cH);
            break;
        case 'circle':
            ctx.beginPath();
            ctx.arc(midX, midY, radius, 0, radianMax, false);
            ctx.fill();
            break;
        default: //ring
            ctx.beginPath();
            ctx.arc(midX, midY, radius - options.ringThickness / 2 - border, 0, radianMax, false);
            ctx.lineWidth = options.ringThickness + (border * 2);
            ctx.stroke();
            break;
        }
    },

    //paint forground based on % done
    fgPaint = function () {
        if (!options.visible) return;

        var prct = timeEllapsed / animLen, rads;
        ctx.fillStyle = options.colors.filled;
        ctx.strokeStyle = options.colors.filled;

        switch (options.type) {
        case 'bar':
            var w = (cW * prct) - (border * 2);

            w = (w < 0) ? 0 : w;
            ctx.clearRect(border, border, w, cH - (border * 2));
            ctx.fillRect(border, border, w, cH - (border * 2));
            break;
        case 'circle':
            rads = (radianMax * prct) - lastRad;

            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.arc(midX, midY, radius - border, lastRad, lastRad + rads, false);
            ctx.fill();

            lastRad = lastRad + rads;
            break;
        default:
            rads = (radianMax * prct) - lastRad;

            ctx.beginPath();
            ctx.arc(midX, midY, radius - (options.ringThickness / 2) - border, lastRad, lastRad + rads, false);
            ctx.lineWidth = options.ringThickness;
            ctx.stroke();

            lastRad = lastRad + rads;
            break;
        }
    },

    //clear canvas
    clearCanvas = function () {
        ctx.clearRect(0, 0, cW, cH);
    },

    tick = function () {
        var st, end;

        if (timeEllapsed >= animLen) {
            timer.stop();
            callback();

            return;
        }

        timeEllapsed += framerate;
        st = (new Date()).getTime();
        fgPaint();
        end = (new Date()).getTime();

        //if we take too long to paint, then increase framerate
        if ((end - st) > PAINT_TIME && fps_rate !== FPS_RATES.length - 1) {
            fps_rate++;
            framerate = 1E3 / FPS_RATES[fps_rate];
            clearInterval(tickLoop);
            tickLoop = setInterval(tick, framerate);
        }
    },

    timer = {
        state: function (st) {
            if (st === undefined)
                return {
                    locked: timer.locked,
                    stopped: timer.stopped()
                };

            if (st.locked) timer.lock();
            if (st.stopped) timer.stop();
            
            return timer;
        },
        timeLeft: function (time) {
            if (time === undefined) return (animLen - timeEllapsed);

            if (timer.locked || time > animLen || time < 0) return false;

            timeEllapsed = (animLen - time);
            return true;
        },
        animLen: function (len) {
            if (len === undefined) return animLen;

            if (timer.locked || len < 0) return false;

            timer.stop();
            animLen = len;
            timer.reset();
            return true;
        },
        start: function () {
            if (timer.locked || tickLoop !== null) return false;

            tickLoop = setInterval(tick, framerate);
            return true;
        },
        stop: function () {
            if (timer.locked) return false;

            clearInterval(tickLoop);
            tickLoop = null;
            return true;
        },
        reset: function () {
            var bLock = timer.locked;

            timer.unlock();
            timer.stop();
            bgPaint();

            lastRad = 0;
            timeEllapsed = 0;

            //if it was locked before, relock it.
            if (bLock) timer.lock();
        },
        lock: function () { timer.locked = true; },
        unlock: function () { timer.locked = false; },
        visible: function (v) { options.visible = v; if (v) bgPaint(); },
        stopped: function () { return tickLoop === null; },
        locked: false,
        canvas: canvas
    };

    timer.reset();

    //Public Interface
    return timer;
}

//////////////////////////////////////
// Register jQuery Plugin
//////////////////////////////////////
//register plugin with jQuery
$.fn.OmniSlide = electricSlide;

//////////////////////////////////////
// Build the API variable
//////////////////////////////////////
//build global object for use by plugins as utilities
$.OmniSlide = {
    version: 0.7,
    //general logging override to avoid errors
    _log: function (type, args) {
        if (console && console[type]) {
            args = ([].slice.call(args, 0));
            args.unshift($.OmniSlide._time());
            console[type].apply(this, args);
            return console;
        }

        return {};
    },
    _time: function () {
        return '[' + (new Date()).toISOString().replace(/.*T|Z/g, '') + ']';
    },
    getRandKey: function (obj) {
        var keys = $.OmniSlide.getKeys(obj);
        return keys[$.OmniSlide.rand(keys.length)];
    },
    //gets pertinent CSS attributes of an element
    //and returns an object containing them
    getCss: function ($elm, attrs) {
        var css = {}, i;

        for (i = 0; i < attrs.length; ++i) {
            css[attrs[i]] = $elm.css(attrs[i]);
        }

        return css;
    },
    //iterates through an object and returns the keys
    //optionally showing the private "_*" keys as well
    getKeys: function (obj, showPrivate) {
        var keys = [], key;
        for (key in obj) {
            if (showPrivate || key.charAt(0) != '_')
                keys.push(key);
        }
        return keys;
    },
    //generates a random number between 0 -> max
    //also a little more "random" than built in
    //Math.random() functionality
    rand: function (max) {
        return ((Math.random() * 0x10000) | 0) % max;
    },
    //logging wrappers
    log: function () { $.OmniSlide._log('log', arguments); },
    error: function () { $.OmniSlide._log('error', arguments); },
    warn: function () { $.OmniSlide._log('warn', arguments); },
    debug: function () { $.OmniSlide._log('info', arguments); },
    //XOR: function (a, b) { return a ? !b : b; },
    //XNOR: function (a, b) { return !($.OmniSlide.XOR(a, b)); },
    //generates a Guid that will identify a slider throughout its life.
    generateGuid: function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };

        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    timer: electricTimer
};
//add version string to the global object
$.OmniSlide.versionString = 'v' + $.OmniSlide.version + ' BETA';

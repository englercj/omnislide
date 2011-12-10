(function ($, win, undefined) {
    'use strict';
    //Default settings
    /////////////////////
    var defaults = {
        slides: undefined,      //pass either xmlData, xmlDocument, ul (DOM), ul (jQuery), ul (string jQuery selector)
        startSlide: 1,          //initial slide for the plugin to start displaying (0 based)
        transition: {
            effect: 'fade',     //the name of the transition to use
            easing: 'linear',   //the type of easing to use on animations (empty chooses random)

            wait: 5000,         //the wait time to show each slide 
            //duration: 1000,     //how long the transition animates
            //delay: 100,         //the delay between the start of each box animation
            //rows: 3,            //the number of rows of boxes to use for animations
            //cols: 6,            //the number of cols of boxes to use for animations
            order: 'normal',    //order to animate the boxes (normal, reverse, or random)
            slide: 'this'       //slide to operate on, either 'this' slide or the 'next' slide (next reverses animation)
            //css: {},            //the css to use as an ending point of the box animation
            //animations: undefined//an animation function to use INSTEAD of $.animate (for complex animations)
        },
        timer: {
            enabled: true,      //enable timer?
            height: 40,         //height of the timer
            width: 40,          //width of the timer
            border: 2,          //space between filled and empty colors on the timer
            colors: {
                empty: 'rgba(30, 30, 30, 0.5)', //color to show on unfilled time
                filled: '#FFF'  //color to show as ellapsed time
            },
            refreshRate: 10,    //time in ms between redraws (lower is smoother, reccommend <50)
            ringWidth: 3,       //width of the timer ring (filled, so not including border)
            type: 'ring',       //type of the timer; circle, ring, bar
            animationIn: null,  //custom animation to use for animating the timer into the slide
            animationOut: null  //custom animation to use for animating the timer out of the slide
        },
        navigation: {
            enabled: true,
            opacity: {
                focused: 1,     //the opacity to set on controls when focused
                blurred: 0.1    //the opacity to set on controls when blurred
            }
        },
        thumbs: {
            enabled: false,         //enable thumbnails?
            tooltip: true,          //show as tooltip
            triggerTooltip: 'hover', //event to trigger showing tooltip (if true)
            triggerSlide: 'click'   //event to trigger changing to that slide
        },
        title: {
            animationIn: null,  //custom animation to use for animating the title into the slide
            animationOut: null  //custom animation to use for animating the title out of the slide
        },
        overlay: {
            animationIn: null,  //custom animation to use for animating the overlay into the slide
            animationOut: null  //custom animation to use for animating the overlay out of the slide
        },
        hoverPause: true        //pause when a user hovers into the current slide
    },
    //This was in the CSS theme file as classes, but moved to inline
    //to reduce chance of human error in and to reduce size of, the theme file.
    css = {
        wrapper: {
            overflow: 'visible',
            position: 'relative'
        },
        box: {
            overflow: 'visible',
            position: 'absolute',
            zIndex: 2
        },
        slide: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            zIndex: 3,
            background: '0 0 no-repeat'
        },
        activeSlide: {
            zIndex: 4
        },
        navigation: {
            position: 'absolute',
            zIndex: 10
        },
        timer: {
            position: 'absolute',
            zIndex: 10
        }
    },
    storage = {
        settings: [],
        sliders: [],
        slideIndexes: []
    };

//Main functionality
//////////////////////
function electricSlide(method) {
    //variables
    var settings = {},
        guid = OmniSlide.generateGuid(),
        slides = [],
        slider = {
            $container: {},
            $wrapper: {},
            $slider: {},
            $nav: {},
            $timer: {},
            timer: null,
            $slides: $(),
            $dataElm: $(),
            dataElmVisible: false
        },

        slideIndex,

    //plugin methods
        methods = {
            //initialize the slider plugin
            init: function (options) {
                return this.each(function () { //ensures chainability
                    if (options) $.extend(true, settings, defaults, options);

                        //disable timer if plugin not installed
                        if (!OmniSlide.timer) settings.timer.enabled = false;

                        //place guid where plugins can get at it
                        settings.timer.guid = guid;
                        settings.transition.guid = guid;

                        //parse out the slides into usable data
                        var parse = parseSlides();
                        if (parse) {
                            OmniSlide.error('Error while parsing slides: ', parse);
                            OmniSlide.error('settings.slides: ', settings.slides);

                            return false;
                        }
                        //build out slider HTML
                        buildSlider(this);

                        //setup slide Index and start transition timer
                        slideIndex = -1;
                        moveSlide(settings.startSlide);

                        //fade out the navigation
                        slider.$nav.animate({ opacity: settings.navigation.opacity.blurred });

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
                    if (!loadStorage(this)) return;

                    if (typeof (option) === 'string') {
                        var levels = option.split('.'),
                            opt = settings,
                            i = levels.length - 1,
                            key;

                        while (i--) {
                            opt = opt[levels.shift()];
                        }
                        key = levels.shift();

                        if (value === undefined) return opt[key];

                        if (typeof (value) === 'object')
                            $.extend(true, opt[key], value);
                        else
                            opt[key] = value;
                    }

                    return this;
                },
                //public wrapper around private moveSlide function
                moveSlide: function (slide) {
                    if (!loadStorage(this)) return;

                    moveSlide(slide);

                    return this;
                },
                pause: function () {
                    pauseTimer();

                    return this;
                },
                play: function () {
                    playTimer();

                    return this;
                },
                //public wrapper for animating the overlays
                animateOverlays: function (show) {
                    if (!loadStorage(this)) return;

                    if (show) {
                        showOverlays(slideIndex);
                    } else {
                        hideOverlays(slideIndex);
                    }

                    return this;
                },
                //reverses everything the initialization did
                //should put a user back to the state they were in
                //before calling this plugin
                destroy: function () {
                    if (!loadStorage(this)) return;

                    //remove slider and show the dataElment if it was visible before
                    slider.$wrapper.remove();
                    if (slider.$dataElm.length > 0 && slider.dataElmVisible) slider.$dataElm.show();

                    //reset & delete timer, GC should then pick it up
                    slider.timer.reset();
                    delete slider.timer;

                    //reset core variables
                    storage.settings[guid] = {};
                    storage.sliders[guid] = {};
                    storage.slideIndexes[guid] = 0;

                    return this;
                }
            };

        function loadStorage($elm) {
            guid = $elm.data('guid');
            settings = storage.settings[guid];
            slider = storage.sliders[guid];
            slideIndex = storage.slideIndexes[guid];

            if (!guid) {
                OmniSlide.error('Unable to load from storage, element is not a slider: ', this);
                return false;
            }

            return true;
        }

        function moveSlide(slide) {
            var nextSlide;

            //if number go to that slide
            if (typeof (slide) === 'number') {
                nextSlide = (slide < slider.$slides.length && slide > -1) ? slide : 0;
            }
            //true means move backwards once
            else if (slide === true) {
                nextSlide = (slideIndex - 1 < 0) ? slider.$slides.length - 1 : slideIndex - 1;
            }
            //otherwise move forward once
            else {
                nextSlide = (slideIndex + 1) % slider.$slides.length;
            }

            if (slideIndex === -1) {
                slideIndex = nextSlide;
                slider.$slides.eq(slideIndex).show();
                restartTimer();

                return;
            }

            //hide the overlays and do transition on callback
            hideOverlays(slideIndex, function () {
                resetTimer();

                //attempt to use advanced transitions
                if (OmniSlide.transitionAPI) {
                    //activate the transition and show overlays on callback
                    OmniSlide.transitionAPI.transition(settings.transition, slider.$slides, slideIndex, nextSlide, function () {
                        slideIndex = nextSlide;
                        storage.slideIndexes[guid] = slideIndex;
                        showOverlays(slideIndex, restartTimer);
                        //TODO: Call after transition event
                    });
                }
                //otherwise default to simple built in transitions
                else {
                    switch (settings.transition.type) {
                        case 'cut':
                            slider.$slides.eq(slideIndex).hide();
                            slider.$slides.eq(slideIndex).removeClass('active');
                            slider.$slides.eq(nextSlide).show();
                            slider.$slides.eq(nextSlide).addClass('active');

                            slideIndex = nextSlide;
                            storage.slideIndexes[guid] = slideIndex;
                            restartTimer();
                            break;
                        case 'fade':
                        default:
                            slider.$slides.eq(nextSlide).show();
                            slider.$slides.eq(slideIndex).fadeOut(settings.transition.length, function () {
                                slider.$slides.eq(slideIndex).removeClass('active');
                                slider.$slides.eq(nextSlide).addClass('active');

                                slideIndex = nextSlide;
                                storage.slideIndexes[guid] = slideIndex;
                                restartTimer();
                            });
                    }
                }
            });
        }

        //exec animations on slide overlays, custom or default
        function animateOverlays(i, show, cb) {
            var $timer = slider.$timer,
                $overlay = slider.$slides.eq(i).find('div.slide-overlay'),
                $title = slider.$slides.eq(i).find('h1.slide-title'),
                extFunc, intFunc, overlayWait;

            if (show) {
                extFunc = 'animationIn';
                intFunc = 'fadeIn';
            } else {
                extFunc = 'animationOut';
                intFunc = 'fadeOut';
            }

            if (settings.timer.enabled && $timer.length) {
                if (settings.timer[extFunc]) settings.timer[extFunc].call($timer);
                else slider.$timer[intFunc]();
            }

            if ($title.length) {
                if (settings.title[extFunc]) settings.title[extFunc].call($title);
                else $title[intFunc]();
            }

            if ($overlay.length) {
                if (settings.overlay[extFunc]) settings.overlay[extFunc].call($overlay);
                else $overlay[intFunc]();
            }

            overlayWait = setInterval(function () {
                //wait until animations finish
                if ($timer.is(':animated') || $overlay.is(':animated') || $title.is(':animated'))
                    return;

                //animations done
                clearInterval(overlayWait);

                if (cb) cb();
            }, 50);
        }

        //animateOverlays wrappers
        function hideOverlays(i, cb) { return animateOverlays(i, false, cb); }
        function showOverlays(i, cb) { return animateOverlays(i, true, cb); }

        //resets the timer and/or creates a new one if we dont have one
        function resetTimer() {
            //create and manage timer if they have plugin installed
            if (settings.timer.enabled) {
                if (!slider.timer)
                    slider.timer = new OmniSlide.timer(settings.transition.wait, settings.timer,
                                                    moveSlide, slider.$timer[0]);

                slider.timer.reset();

                return true;
            }

            return false;
        }

        //resets the timer and starts the tick loop
        function restartTimer() {
            if (resetTimer()) slider.timer.start();
        }

        //pauses the timer with optional hard lock
        function pauseTimer(hard) {
            slider.timer.stop();
            if (hard) slider.timer.lock();
            slider.$nav.find('.slide-nav-pause').removeClass('slide-nav-pause').addClass('slide-nav-play');
        }

        //plays the timer optionaly a hard break of the lock
        function playTimer(hard) {
            if (hard) slider.timer.unlock();
            slider.timer.start();
            slider.$nav.find('.slide-nav-play').removeClass('slide-nav-play').addClass('slide-nav-pause');
        }

        //builds out the slider's HTML
        function buildSlider(container) {
            //initialize container
            slider.$container = $(container);

            //create wrapper
            slider.$wrapper = $('<div id="' + guid + '" class="slide-wrapper"/>').css(css.wrapper).appendTo(slider.$container);

            //create slider box
            slider.$slider = $('<div class="slide-box"/>').hover(slideHover).css(css.box).appendTo(slider.$wrapper);

            //create navigation
            if (settings.navigation.enabled) {
                slider.$nav = $('<div class="slide-nav"/>').hover(navHover).css(css.navigation).appendTo(slider.$slider);
                slider.$nav.append(
                    $('<div class="slide-nav-control slide-nav-back">&nbsp;</div>')
                        .hover(navControlHover).click(navControlClick)
                );
                slider.$nav.append(
                    $('<div class="slide-nav-control slide-nav-pause">&nbsp;</div>')
                        .hover(navControlHover).click(navControlClick)
                );
                slider.$nav.append(
                    $('<div class="slide-nav-control slide-nav-forward">&nbsp;</div>')
                        .hover(navControlHover).click(navControlClick)
                );
            }

            //create timer
            if (settings.timer.enabled)
                slider.$timer = $('<canvas class="slide-timer"/>').css(css.timer).appendTo(slider.$slider);

            //create slides and thumbs
            $.each(slides, function (i, slide) {
                var $slide = $('<div class="slide"/>').css(css.slide);

                if (slide.image)
                    $slide.css('background-image', 'url(' + slide.image + ')');
                if (slide.content)
                    $slide.append('<div class="slide-content">' + slide.content + '</div>');
                if (slide.overlay)
                    $slide.append('<div class="slide-overlay" style="display:none;">' + slide.overlay + '</div>');
                if (slide.title)
                    $slide.append('<h1 class="slide-title" style="display:none;">' + slide.title + '</h1>');

                slider.$slides = slider.$slides.add($slide.hide());

                if (settings.thumbs.enabled) {
                    //TODO: Create thumbnails
                }
            });
            slider.$slides.appendTo(slider.$slider);
        }

        //handle hovering in/out of the slide box
        function slideHover(e) {
            if (slider.timer && settings.timer.enabled) {
                if (e.type == 'mouseenter' && settings.hoverPause) {
                    pauseTimer();
                } else if (e.type == 'mouseleave' && slider.timer.stopped) {
                    playTimer();
                }
            }
        }

        //handle hovering in/out of the naviation box
        function navHover(e) {
            if (e.type == 'mouseenter') {
                slider.$nav.stop().animate({ opacity: settings.navigation.opacity.focused });
            } else if (e.type == 'mouseleave') {
                slider.$nav.stop().animate({ opacity: settings.navigation.opacity.blurred });
            }
        }

        //handle hovering in/out of a navigation control
        function navControlHover(e) {
            if (e.type == 'mouseenter') {
                $(this).addClass('active');
            } else if (e.type == 'mouseleave') {
                $(this).removeClass('active');
            }
        }

        //handle nav control button click
        function navControlClick(e) {
            var ctrl = $.trim(this.className.replace(/slide-nav-control|active/g, ''));

            switch (ctrl) {
                case 'slide-nav-back':
                    moveSlide(true);
                    break;
                case 'slide-nav-forward':
                    moveSlide();
                    break;
                case 'slide-nav-play':
                    playTimer(true);
                    break;
                case 'slide-nav-pause':
                    pauseTimer(true);
                    break;
            }
        }

        //parses the slide input into a normalized format
        function parseSlides() {
            var data = settings.slides,
                $data;

            if (!data) return 'settings.slides is not defined!';

            if ($.type(data) === 'string') {
                //if its a string it must be either a selector
                //or xml data, lets try to parse the xml and if
                //we fail lets assume its a selector
                try {
                    $data = $($.parseXML(data));
                } catch (error) {
                    $data = $(data);
                }
            } else if ($.type(data) === 'object') {
                //if its an object then it is either a DOM object,
                //an xmlDocument, or a jQuery object. In any of these
                //cases we need to just wrap it in a jQuery object
                $data = $(data);
            }

            //parse as ul data
            if ($data.is('ul')) {
                $data.find('li').each(function (i, slide) {
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

        //method calling
        if (methods[method]) {
            return methods[method].apply(this, [].slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method "' + method + '" does not exist in jQuery.slide');
        }
    }

    //register jQuery plugin
    $.fn.extend({
        OmniSlide: electricSlide,
        omnislide: electricSlide
    });

    //build global object for use by plugins as utilities
    win.OmniSlide = {
        version: 0.1,
        //general logging override to avoid errors
        _log: function (type, args) {
            if (win.console && console[type]) {
                console[type].apply(this, args);
                return win.console;
            }

            return {};
        },
        _getRandKey: function (obj) {
            var keys = OmniSlide._getKeys(obj);
            return keys[OmniSlide._rand(keys.length)];
        },
        //gets pertinent CSS attributes of an element
        //and returns an object containing them
        _getCss: function ($elm, attrs) {
            var css = {}, i;

            for (i = 0; i < attrs.length; ++i) {
                css[attrs[i]] = $elm.css(attrs[i]);
            }

            return css;
        },
        //iterates through an object and returns the keys
        //optionally showing the private "_*" keys as well
        _getKeys: function (obj, showPrivate) {
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
        _rand: function (max) {
            return ((Math.random() * 0x10000) | 0) % max;
        },
        //logging wrappers
        log: function () { OmniSlide._log('log', arguments); },
        error: function () { OmniSlide._log('error', arguments); },
        warn: function () { OmniSlide._log('warn', arguments); },
        //generates a Guid that will identify a slider throughout its life.
        generateGuid: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };

            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        }
    };
    //add version string to the global object
    OmniSlide.versionString = 'v' + OmniSlide.version + ' BETA';
})(jQuery, window);
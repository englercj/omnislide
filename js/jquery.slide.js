(function ($, win, undefined) {
    //Default settings
    /////////////////////
    var defaults = {
        slides: undefined,      //pass either xmlData, xmlDocument, ul (DOM), ul (jQuery), ul (string jQuery selector)
        startSlide: 1,          //initial slide for the plugin to start displaying
        transition: {
            type: 'fade',       //the type of transition to use
            effect: 'full',     //specific transition effect
            easing: 'linear',   //the type of easing to use on transitions
            wait: 5000,         //the wait time to show each slide 
            length: 500,        //how long the transition animates
            direction: 'down',      //direction the animation goes (like 'down' or 'right')
            position: 'top',       //start position of the animation (like 'top' or 'topleft')
            animatorNum: 20,    //applies to strips/boxes; is the number of strips/boxes
            animatorDelay: 50   //applies ot strips/boxes; delay between each strip/box
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
            ringWidth: 3,
            style: 'ring'       //style of the timer; circle, ring, bar
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
        hoverPause: true    //pause when a user hovers into the current slide
    };

    //Main functionality
    //////////////////////
    function electricSlide(method) {
        //variables
        var settings = {},
        guid = getGuid(),
        slides = [],
        slider = {
            $container: {},
            $wrapper: {},
            $slider: {},
            $nav: {},
            $timer: {},
            timer: null,
            $slides: $()
        },

        slideIndex, loopTransition,
        forcePaused = false,
        $dataElm, dataElmVisible,

        //plugin methods
        methods = {
            //initialize the slider plugin
            init: function (options) {
                return this.each(function () { //ensures chainability
                    if (options) $.extend(true, settings, defaults, options);

                    //disable timer if plugin not installed
                    if (!OmniSlide.timer) settings.timer.enabled = false;

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
                    slideIndex = (settings.startSlide > 1) ? settings.startSlide - 2 : -1;
                    doTransition();

                    //fade out the navigation
                    slider.$nav.animate({ opacity: settings.navigation.opacity.blurred });

                    return true;
                });
            },
            //changes an option to the given value
            //and/or returns value given by that option
            option: function (option, value) {
                if (typeof (option) === 'string') {
                    if (value === undefined) return settings[option];

                    settings[option] = value;
                }

                return this;
            },
            //reverses everything the initialization did
            //should put a user back to the state they were in
            //before calling this plugin
            destroy: function () {
                //remove this live event
                //$('div.slide-nav-control').die('click');

                //remove slider and show the dataElment if it was visible before
                slider.$wrapper.remove();
                if ($dataElm && dataElmVisible) $dataElm.show();

                //reset & delete timer, GC should then pick it up
                slider.timer.reset();
                delete slider.timer;

                //reset core variables
                slides = [];
                slider = {
                    $container: {},
                    $wrapper: {},
                    $slider: {},
                    $nav: {},
                    $timer: {},
                    timer: null,
                    $slides: $()
                };
            }
        };

        function doTransition(backward) {
            var nextSlide;

            if (backward) nextSlide = (slideIndex - 1 <= 0) ? slider.$slides.length - 1 : slideIndex - 1;
            else nextSlide = (slideIndex + 1) % slider.$slides.length;

            if (OmniSlide.transition) { //attempt to use advanced transitions
                OmniSlide.transition(settings.transition, slider.$slides, slideIndex, nextSlide, function () {
                    slideIndex = nextSlide;
                    resetTimer();
                });
            } else { //otherwise default to built ins
                switch (settings.transition.type) {
                    case 'cut':
                        slider.$slides.eq(slideIndex).hide();
                        slider.$slides.eq(slideIndex).removeClass('active');
                        slider.$slides.eq(nextSlide).show();
                        slider.$slides.eq(nextSlide).addClass('active');

                        slideIndex = nextSlide;
                        resetTimer();
                        break;
                    case 'fade':
                    default:
                        slider.$slides.eq(nextSlide).show();
                        slider.$slides.eq(slideIndex).fadeOut(settings.transition.length, function () {
                            slider.$slides.eq(slideIndex).removeClass('active');
                            slider.$slides.eq(nextSlide).addClass('active');
                            slideIndex = nextSlide;

                            resetTimer();
                        });
                }
            }
        }

        function resetTimer() {
            //create and manage timer if they have plugin installed
            if (settings.timer.enabled) {
                if (!slider.timer)
                    slider.timer = new OmniSlide.timer(settings.transition.wait, settings.timer,
                                                    doTransition, slider.$timer[0]);

                slider.timer.reset();
                slider.timer.start();
            }
        }

        //builds out the slider
        function buildSlider(container) {
            //initialize container
            slider.$container = $(container);

            //create wrapper
            slider.$wrapper = $('<div id="' + guid + '" class="slide-wrapper"/>').appendTo(slider.$container);

            //create slider box
            slider.$slider = $('<div class="slide-box"/>').hover(slideHover).appendTo(slider.$wrapper);

            //create navigation
            if (settings.navigation.enabled) {
                slider.$nav = $('<div class="slide-nav"/>').hover(navHover).appendTo(slider.$slider);
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
                slider.$timer = $('<canvas class="slide-timer"/>').appendTo(slider.$slider);

            //create slides and thumbs
            $.each(slides, function (i, slide) {
                var $slide = $('<div class="slide"/>');

                if (slide.image)
                    $slide.css('background-image', 'url(' + slide.image + ')');
                if (slide.content)
                    $slide.append(slide.content);
                if (slide.overlay)
                    $slide.append('<div class="slide-overlay">' + slide.overlay + '</div>');
                if (slide.title)
                    $slide.append('<h1 class="slide-title">' + slide.title + '</h1>');

                slider.$slides = slider.$slides.add($slide.hide());

                if (settings.thumbs.enabled) {
                    //TODO: Create thumbnails
                }
            });
            slider.$slides.appendTo(slider.$slider);
        }

        //handle hovering in/out of the slide box
        function slideHover(e) {
            if (e.type == 'mouseenter' && settings.hoverPause) {
                slider.timer.stop();
            } else if (e.type == 'mouseleave' && slider.timer.stopped) {
                slider.timer.start();
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
            var $this = $(this),
                ctrl = $.trim(this.className.replace(/slide-nav-control|active/g, ''));

            switch (ctrl) {
                case 'slide-nav-back':
                    slider.timer.finish(function () {
                        doTransition(true);
                    });
                    break;
                case 'slide-nav-forward':
                    slider.timer.finish(doTransition);
                    break;
                case 'slide-nav-play':
                    slider.timer.unlock();
                    slider.timer.start();
                    $this.removeClass('slide-nav-play').addClass('slide-nav-pause');
                    break;
                case 'slide-nav-pause':
                    slider.timer.stop();
                    slider.timer.lock();
                    $this.removeClass('slide-nav-pause').addClass('slide-nav-play');
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
                dataElmVisible = $data.is(':visible');
                $dataElm = $data.hide();
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

        //guid for this instance
        function getGuid() {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
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

    $.fn.extend({
        OmniSlide: electricSlide,
        omnislide: electricSlide 
    });

    win.OmniSlide = {
        version: 0.1,
        _log: function (type, args) {
            if (win.console && console[type]) {
                console[type].apply(this, args);
                return win.console;
            }

            return {};
        },
        log: function () { OmniSlide._log('log', arguments); },
        error: function () { OmniSlide._log('error', arguments); },
        warn: function () { OmniSlide_log('warn', arguments); }
    };
    OmniSlide.versionString = 'v' + OmniSlide.version + ' BETA';
})(jQuery, window);
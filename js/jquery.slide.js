(function ($, win, undefined) {
    var settings = {
        slides: undefined,  //pass either xmlData, xmlDocument, ul (DOM), ul (jQuery), ul (string jQuery selector)
        startSlide: 1,      //initial slide for the plugin to start displaying
        transition: {
            type: 'cut',   //the type of transition to use
            easing: 'linear', //the type of easing to use on transitions
            wait: 5000,     //the wait time to show each slide
            length: 500     //how long the transition animates
        },
        timer: {
            enabled: true, //enable timer?
            height: 35, //height of the timer
            width: 35,  //width of the timer
            colors: {
                empty: 'rgba(10, 10, 10, 0.4)',     //color to show on unfilled time
                filled: 'rgb(150, 150, 150)'  //color to show as ellapsed time
            },
            refreshRate: 20, //time in ms between redraws (lower is smoother)
            ringWidth: 5,
            style: 'ring'   //style of the timer; circle, ring, bar
        },
        hoverPause: true    //pause when a user hovers into the current slide
    },

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
    $dataElm,

    methods = {
        init: function (options) {
            return this.each(function () { //ensures chainability
                if (options) $.extend(true, settings, options);

                //disable timer if plugin not installed
                if (!slideTimer) settings.timer.enabled = false; 

                //parse out the slides into usable data
                var parse = parseSlides();
                if (parse) {
                    error('Error while parsing slides: ', parse);
                    error('settings.slides: ', settings.slides);

                    return false;
                }

                //build out slider HTML
                buildSlider(this);

                //setup slide Index and start transition timer
                slideIndex = (settings.startSlide > 0) ? settings.startSlide - 1 : 0;
                doTransition();

                //fade out the navigation
                slider.$nav.animate({ opacity: 0 });

                return true;
            });
        },
        destroy: function () {
            slides = [];
            $dataElm && $dataElm.show();
            slider.$wrapper.remove();
        }
    };

    function doTransition() {
        //reset timer element

        var nextSlide = (slideIndex + 1) % slider.$slides.length;
        switch (settings.transition.type) {
            case 'cut':
                slider.$slides.eq(slideIndex).hide();
                slider.$slides.eq(slideIndex).removeClass('active');
                slider.$slides.eq(nextSlide).show();
                slider.$slides.eq(nextSlide).addClass('active');

                slideIndex = nextSlide;
                break;
            case 'fade':
            default:
                slider.$slides.eq(nextSlide).show();
                slider.$slides.eq(slideIndex).stop().fadeOut(settings.transition.length, function () {
                    slider.$slides.eq(slideIndex).removeClass('active');
                    slider.$slides.eq(nextSlide).addClass('active');
                    slideIndex = nextSlide;
                });
        }

        //create and manage timer if they have plugin installed
        if (settings.timer.enabled) {
            if (!slider.timer)
                slider.timer = new slideTimer(settings.transition.wait, settings.timer,
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
        slider.$wrapper = $('<div class="slide-wrapper"/>').appendTo(slider.$container);

        //create slider box
        slider.$slider = $('<div class="slide-box"/>').hover(slideHover).appendTo(slider.$wrapper);

        //create navigation
        slider.$nav = $('<div class="slide-nav"/>').hover(navHover).appendTo(slider.$slider);

        //create timer
        if (settings.timer.enabled)
            slider.$timer = $('<canvas class="slide-timer"/>').appendTo(slider.$slider);

        //create slides
        $.each(slides, function (i, slide) {
            var $slide = $('<div class="slide">');

            $slide.css('background-image', 'url(' + slide.image + ')');
            $slide.append(slide.content);

            slider.$slides = slider.$slides.add($slide.hide());
            //$slide.hover(slideHoverIn, slideHoverOut);
        });
        slider.$slides.appendTo(slider.$slider);
    }

    function slideHover(e) {
        if (e.type == 'mouseenter' && settings.hoverPause) {
            slider.timer.stop();
        } else if (e.type == 'mouseleave' && slider.timer.stopped) {
            slider.timer.start();
        }
    }

    function navHover(e) {
        if (e.type == 'mouseenter') {
            slider.timer.stop();
        } else if (e.type == 'mouseleave') {
            slider.timer.start();
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

        if ($data.is('ul')) { //parse as ul data
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
            $dataElm = $data.hide();
        } else if ($data.find('slides > slide').length > 0) { //parse as xml data
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

        if (slides.length === 0) return 'settings.slides is either an invalid type or formatted incorrectly.';

        return false;
    }

    //Log overrides for safety
    function log() { _log('log', arguments); }
    function error() { _log('error', arguments); }
    function warn() { _log('warn', arguments); }

    function _log(type, args) {
        if (win.console && console[type]) {
            console[type].apply(this, args);
            return win.console;
        }

        return {};
    }

    $.fn.extend({
        slide: function (method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.init.apply(this, arguments);
            } else {
                $.error('Method "' + method + '" does not exist in jQuery.slide');
            }
        }
    });
})(jQuery, window);
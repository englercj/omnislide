/*
 * Each transition has its own options, but they follow the format:
 * OmniSlide.transition(options);
 * WHERE options contains ATLEAST
    {
        effect: 'fade',     //the name of the transition to use
        easing: 'linear',   //the type of easing to use on animations (empty chooses random)

        wait: 5000,         //the wait time to show each slide 
        duration: 1000,     //how long the transition animates
        delay: 100,         //the delay between the start of each box animation

        rows: 3,            //the number of rows of boxes to use for animations
        cols: 6,            //the number of cols of boxes to use for animations
        order: 'normal',    //order to animate the boxes (normal, reverse, or random)
        slide: 'this',      //slide to operate on, either 'this' slide or the 'next' slide (next reverses animation)

        css: {},            //the css to use as an ending point of the box animation
        animations: false   //an animation function to use INSTEAD of $.animate (for complex animations)
    }
*/

(function ($, win, undefined) {
    win.OmniSlide.transitionAPI = {
        transition: function (opts, $slides, index, next, callback) {
            //store vars locally for easier access and to lose references
            var api = OmniSlide.transitionAPI,
                options = $.extend(true, {}, opts),
                directions = ['left', 'topleft', 'top', 'topright', 'right', 'bottomright', 'bottom', 'bottomleft'],
                slideKeys = ['this', 'next'];

            //setup some reasonable defaults
            options.effect = options.effect || 'fade';
            options.easing = (!options.easing || !$.easing[options.easing]) ? 'linear' : options.easing;
            options.length = options.length || 800;

            if (options.effect == 'random') options.effect = _getRandKey(api.transitions);
            if (options.easing == 'random') options.easing = _getRandKey($.easing);
            if (options.direction == 'random') options.direction = directions[_getRandKey(directions)];
            if (options.slide == 'random') options.slide = slideKeys[_getRandKey(slideKeys)];

            if (!api.transitions[options.effect] || options.effect.charAt(0) == '_') {
                //no transition found, or no default found
                OmniSlide.warn('Unable to find transition "%s", using default fade', options.effect);
                options.effect = 'fade';
            }

            if (!options.css && !options.animation)
                options = $.extend(true, {}, api.transitions[options.effect], options);

            return api._doTransition($slides, index, next, options, callback);
        },
        _css: {
            box: {
                overflow: 'hidden',
                position: 'absolute'
            },
            boxWrap: {
                overflow: 'hidden',
                position: 'relative',
                top: 0,
                display: 'block',
                zIndex: 7
            },
            slide: { zIndex: 3 },
            activeSlide: { zIndex: 4 }
        },
        _activate: function ($slide) {
            $slide.show().addClass('active').css(OmniSlide.transitionAPI._css.activeSlide);
        },
        _deactivate: function ($slide) {
            $slide.hide().removeClass('active').css(OmniSlide.transitionAPI._css.slide);
        },
        _doTransition: function ($slides, index, next, opt, callback) {
            var api = OmniSlide.transitionAPI, cssKeys = OmniSlide._getKeys(opt.css),
                boxes, $boxes, $wrapper, len, evalCss;

            if (opt.slide == 'next') {
                boxes = api._boxifySlide($slides.eq(next), opt.rows, opt.cols, opt.guid);
            } else {
                boxes = api._boxifySlide($slides.eq(index), opt.rows, opt.cols, opt.guid);

                api._deactivate($slides.eq(index));
                api._activate($slides.eq(next));
            }

            //setup variables
            $boxes = boxes[0];
            $wrapper = boxes[1];
            len = $boxes.length;
            $slides.parent().append($wrapper);

            //reverse array if we need too
            if (opt.order == 'reverse') { $boxes = $($boxes.get().reverse()); }

            //check if any css functions need to be evaluated
            $.each(opt.css, function (key, val) {
                if (typeof (val) === 'function') {
                    opt.css[key] = opt.css[key].call($box, j, opt);
                }
            });

            for (var i = 0; i < len; ++i) {
                var $box, toCss = opt.css, j = i;
                if (opt.order == 'random') {
                    //select a random box and remove it from the elements to choose from
                    j = OmniSlide._rand($boxes.length);
                    $box = $boxes.eq(j);
                    $boxes = $boxes.not($box);
                } else { $box = $boxes.eq(j); }

                if (opt.slide == 'next') {
                    //if slide is next, then we need to reverse animation
                    //so store the current values of whatever css we are changing
                    //as the css to animate towards and then assign the specified 
                    //css to the box now
                    toCss = OmniSlide._getCss($box, cssKeys);
                    $box.css(opt.css);
                    //special case where we apply a '-=' or '+=' css
                    //we need to reverse that in the toCss
                    $.each(opt.css, function (key, val) {
                        if (typeof(val) === 'string') {
                            if(val.indexOf('-=') > -1)
                                toCss[key] = val.replace('-=', '+=');
                            else if (val.indexOf('+=') > -1)
                                toCss[key] = val.replace('+=', '-=');
                        }
                    });
                }

                if (i < len - 1) {
                    $box.delay((opt.delay * i), 'omnislide.transition')
                        .queue('omnislide.transition', function (next) {
                            if (opt.animation && typeof (opt.animation) === 'function') {
                                opt.animation.call(this, toCss, opt);
                            } else {
                                $(this).animate(toCss, opt.duration, opt.easing);
                            }
                            next();
                        })
                        .dequeue('omnislide.transition');
                } else {
                    var j = (opt.order == 'random') ? $boxes.eq(0) : $boxes.eq(i);
                    $box.delay((opt.delay * i), 'omnislide.transition')
                        .queue('omnislide.transition', function (next) {
                            if (opt.animation && typeof (opt.animation) === 'function') {
                                opt.animation.call(this, opt, transitionDone);
                            } else {
                                $(this).animate(toCss, opt.duration, opt.easing, transitionDone);
                            }
                            next();
                        })
                        .dequeue('omnislide.transition');
                }
            }

            function transitionDone() {
                if (opt.slide == 'next') {
                    api._deactivate($slides.eq(index));
                    api._activate($slides.eq(next));
                }
                $wrapper.remove();

                if (callback) callback();
            }
        },
        _boxifySlide: function ($slide, rows, cols, guid) {
            var slideW = $slide.width(), slideH = $slide.height(),
                w = slideW / cols, h = slideH / rows,
                $boxes = $(), $wrapper,
                api = OmniSlide.transitionAPI;

            //create boxes and set them up
            for (var y = 0; y < rows; ++y) {
                for (var x = 0; x < cols; ++x) {
                    var $box, $contents;

                    $contents = $('<div class="slider-transition-box-contents"></div>')
                        .css({
                            width: slideW,
                            height: slideH,
                            marginLeft: -(w * x),
                            marginTop: -(h * y)
                        })
                        .append(
                            $slide.clone().css({
                                width: slideW,
                                height: slideH
                            }).show()
                        );

                    $box = $('<div class="slider-transition-box"></div>')
                        .css({
                            width: w + 1,
                            height: h + 1,
                            left: (w * x),
                            top: (h * y)
                        })
                        .css(api._css.box)
                        .append($contents);

                    $boxes = $boxes.add($box);
                }
            }
            $wrapper = $('<div class="slide-transition-box-wrapper" id="slider-transition-box-wrapper-' + guid + '"/>')
                    .css({
                        height: slideH,
                        width: slideW
                    })
                    .css(api._css.boxWrap)
                    .append($boxes);

            return [$boxes, $wrapper];
        }
    };

    win.OmniSlide.transitionAPI.transitions = {
        fade: {
            css: { opacity: 0 },
            delay: 1,
            duration: 800,
            rows: 1,
            cols: 1
        },
        stripShrink: {
            css: { width: 0, height: 0 },
            delay: 100,
            duration: 1000,
            rows: 6,
            cols: 1
        },
        stripFadeHorizontal: {
            css: { opacity: 0 },
            delay: 250,
            duration: 800,
            rows: 6,
            cols: 1
        },
        stripFadeVertical: {
            css: { opacity: 0 },
            delay: 250,
            duration: 800,
            rows: 1,
            cols: 6
        },
        boxFade: {
            css: { opacity: 0 },
            delay: 100,
            duration: 800,
            rows: 3,
            cols: 6
        },
        boxShrink: {
            css: { width: 0, height: 0 },
            delay: 100,
            duration: 800,
            rows: 3,
            cols: 6
        },
        boxFadeShrink: {
            css: { opacity: 0, width: 0, height: 0 },
            delay: 100,
            duration: 800,
            rows: 3,
            cols: 6
        },
        boxFly: {
            css: {
                left: function (i, opt) {
                    var p;
                    if(opt.direction.indexOf('left') > -1) p = '-=';
                    else if(opt.direction.indexOf('right') > -1) p = '+=';

                    return (p + ($(this).parent().width() + $(this).width() + 1) + 'px');
                },
                top: function (i, opt) {
                    var p;
                    if(opt.direction.indexOf('top') > -1) p = '-=';
                    else if(opt.direction.indexOf('bottom') > -1) p = '+=';

                    return (p + ($(this).parent().height() + $(this).height() + 1) + 'px');
                }
            },
            delay: 100,
            duration: 1500,
            rows: 3,
            cols: 6,
            direction: 'lefttop'
        },
    };

    //        //Transition extension example
    //        (function($, window, undefined) {
    //            var api = OmniSlide.transitionAPI;
    //
    //            $.extend(api.transitions, {
    //                cut: {
    //                    //values here are overriden by values input to 
    //                    //the plugin so the values you put here are defaults
    //                    css: { opacity: 0 },
    //                    order: 'normal',
    //                    delay: 0,
    //                    duration: 0,
    //                    rows: 1, 
    //                    cols: 1
    //                },
    //                advanced: {
    //                    order: 'normal',
    //                    delay: 100,
    //                    duration: 1000,
    //                    rows: 6, 
    //                    cols: 6
    //                    //if your transition is more advanced than simple css
    //                    //manipulation you can specify an animation function
    //                    //to be called instead of the default $.animate(css)
    //                    anim: function(opt, callback) {
    //                        //the 'this' argument is the DOM element to manipulate
    //
    //                        //the opt variable passed is the transition options
    //                        //object, which has been extended into this object
    //                        //the 'advanced' object in this case
    //                        $(this).animate(opt.css, opt.duration, opt.easing, function() {
    //                            //always check if a callback was passed,
    //                            //and if so be sure to call it after your 
    //                            //animations complete. Not doing so will
    //                            //break the slider
    //                            if(callback) callback();
    //                        });
    //                    }
    //                }
    //            });
    //        })(jQuery, window);
})(jQuery, window);
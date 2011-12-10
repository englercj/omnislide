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

        css: {},            //the css to use as an ending point of the box animation
        animations: false   //an animation function to use INSTEAD of $.animate (for complex animations)
    }
*/

(function ($, win, undefined) {
    win.OmniSlide.transitionAPI = {
        transition: function (opts, $slides, index, next, callback) {
            //store vars locally for easier access and to lose references
            var api = OmniSlide.transitionAPI,
                options = $.extend(true, {}, opts);

            //setup some reasonable defaults
            options.effect = options.effect || 'fade';
            options.easing = (!options.easing || !$.easing[options.easing]) ? 'linear' : options.easing;
            options.wait = options.wait || 5000;
            options.length = options.length || 500;
            options.animatorNum = options.animatorNum || 15;

            if (options.effect == 'random') {
                var effects = OmniSlide._getKeys(api.transitions[options.type]);
                options.effect = effects[OmniSlide._rand(effects.length)];
            }

            if (options.easing == 'random') {
                var easings = OmniSlide._getKeys($.easing);
                options.easing = easings[OmniSlide._rand(easings.length)];
            }

            if (!api.transitions[options.effect] || options.effect.charAt(0) == '_') {
                //no transition found, or no default found
                OmniSlide.warn('Unable to find transition "%s", using default fade', options.effect);
                options.effect = 'fade';
            }

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
        _doTransition: function($slides, index, next, options, callback) {
            var api = OmniSlide.transitionAPI, dir = options.direction,
                opt = $.extend({}, options, api.transitions[options.effect]),
                boxes = api._boxifySlide($slides.eq(index), opt.rows, opt.cols, opt.guid), 
                $boxes = boxes[0], $wrapper = boxes[1], len = $boxes.length;
                
            $slides.parent().append($wrapper);
            api._deactivate($slides.eq(index));
            api._activate($slides.eq(next));
            
            if(opt.order == 'reverse') { $boxes = $($boxes.get().reverse()); }
            
            for(var i = 0; i < len; ++i) {
                var $box;
                if(opt.order == 'random') {
                    //select a random box and remove it from the elements to choose from
                    var rand = OmniSlide._rand($boxes.length);
                    $box = $boxes.eq(rand);
                    $boxes = $boxes.not($box);
                } else { $box = $boxes.eq(i); }

                if(i < len - 1) {
                    $box.delay((opt.delay * i), 'omnislide.transition')
                        .queue('omnislide.transition', function(next) {
                            if(opt.animation && typeof(opt.animation) === 'function') {
                                opt.animation.call(this, opt);
                            } else {
                                $(this).animate(opt.css, opt.duration, opt.easing);
                            }
                            next();
                        })
                        .dequeue('omnislide.transition');
                } else {
                    var j = (opt.order == 'random') ? $boxes.eq(0) : $boxes.eq(i);
                    $box.delay((opt.delay * i), 'omnislide.transition')
                        .queue('omnislide.transition', function(next) {
                            if(opt.animation && typeof(opt.animation) === 'function') {
                                opt.animation.call(this, opt, transitionDone);
                            } else {
                                $(this).animate(opt.css, opt.duration, opt.easing, transitionDone);
                            }
                            next();
                        })
                        .dequeue('omnislide.transition');
                }
            }

            function transitionDone() {
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
                            marginLeft: -(w*x),
                            marginTop: -(h*y)
                        })
                        .append(
                            $slide.clone().css({ 
                                width: slideW,
                                height: slideH
                            }).show()
                        );

                    $box = $('<div class="slider-transition-box"></div>')
                        .css({
                            width: w+1,
                            height: h+1,
                            left: (w*x),
                            top: (h*y)
                        })
                        .css(api._css.box)
                        .append($contents);
                        
                    $boxes = $boxes.add($box);
                }
            }
            $wrapper = $('<div class="slide-transition-box-wrapper" id="slider-transition-box-wrapper-' + guid + '"/>')
                    .css({
                        height: slideH,
                        width: slideW,
                    })
                    .css(api._css.boxWrap)
                    .append($boxes);

            return [$boxes, $wrapper];
        }
    };

    win.OmniSlide.transitionAPI.transitions = {
        fade: {
            css: { opacity: 0 },
            delay: 0,
            order: 'normal',
            rows: 1,
            cols: 1
        },
        stripFadeHorizontal: {
            css: { opacity: 0 },
            delay: 250,
            rows: 1
        },
        stripFadeVertical: {
            css: { opacity: 0 },
            delay: 250,
            cols: 1
        },
        boxFade: {
            css: { opacity: 0 },
            delay: 100
        },
        boxFadeShrink: {
            css: { opacity: 0, width: 0, height: 0 },
            delay: 150
        }
    };

//        //Transition extension example
//        (function($, window, undefined) {
//            var api = OmniSlide.transitionAPI;
//
//            $.extend(api.transitions, {
//                cut: {
//                    css: { opacity: 0 },
//                    //values here override input to the plugin so even
//                    //if someone specifies values for rows/cols/duration/etc..
//                    //they will be overwrote by these values
//                    rows: 1, 
//                    cols: 1,
//                    duration: 1
//                },
//                advanced: {
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
$.OmniSlide.transitionAPI = {
    transition: function (opts, $slides, index, next, callback) {
        //store vars locally for easier access and to lose references
        var api = $.OmniSlide.transitionAPI,
        options = $.extend(true, {}, opts);

        //effect needs to be determined BEFORE we extend
        api._setRandomIfInvalid(options, 'effect', api.transitions);

        //extend onto the api.transitions effect
        options = $.extend(true, {}, api.transitions[options.effect], options);

        //This randomizes values if its an array, its 'random', or its undefined
        for (var key in api._validKeys) api._setRandomIfInvalid(options, key);

        //run the transition
        return api._doTransition($slides, index, next, options, callback);
    },
    _validKeys: {
        easing: $.easing,
        direction: ['left', 'topleft', 'top', 'topright', 'right', 'bottomright', 'bottom', 'bottomleft'],
        slide: ['this', 'next'],
        order: ['normal', 'reverse', 'randomize']//TODO: Implement spiral order
    },
    _activate: function ($slide) {
        $slide.show().addClass('active');
    },
    _deactivate: function ($slide) {
        $slide.hide().removeClass('active');
    },
    _setRandomIfInvalid: function (obj, key, vals) {
        var api = $.OmniSlide.transitionAPI,
        err;

        vals = vals || api._validKeys[key];

        //if its an array, get random value of that array
        //special case
        if ($.isArray(obj[key])) {
            api._setToRandom(obj, key, obj[key]);
        }
        //if its 'random', randomize it
        else if (obj[key] == 'random' || obj[key] === undefined) {
            api._setToRandom(obj, key, vals);
        }
        //if its private, randomize it, and warn them
        else if (obj[key].charAt(0) == '_') {
            err = 'Value "' + obj[key] + '" for option "' + key + '" is private. ';
            api._setToRandom(obj, key, vals);
        }
        //if its an invalid value, randomize it, and warn them
        else if (($.isArray(vals) && $.inArray(obj[key], vals) === -1) || ($.isPlainObject(vals) && [obj[key]] === undefined)) {
            err = 'Value "' + obj[key] + '" for option "' + key + '" doesn\'t exist. ';
            api._setToRandom(obj, key, vals);
        }

        if (err) {
            err += 'It has been assigned a random value (' + obj[key] + ').';
            $.OmniSlide.warn(err);
        }
    },
    _setToRandom: function (obj, key, vals) {
        if ($.isArray(vals)) obj[key] = vals[$.OmniSlide.getRandKey(vals)];
        else obj[key] = $.OmniSlide.getRandKey(vals);
    },
    _doTransition: function ($slides, index, next, opt, callback) {
        var api = $.OmniSlide.transitionAPI, cssKeys = $.OmniSlide.getKeys(opt.css),
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
            if ($.isFunction(val)) {
                opt.css[key] = val.call($box, opt);
            }
        });

        function reverseCSS(key, val) {
            if ($.type(val) == 'string') {
                if (val.indexOf('-=') > -1)
                    toCss[key] = val.replace('-=', '+=');
                else if (val.indexOf('+=') > -1)
                    toCss[key] = val.replace('+=', '-=');
            }
        }

        for (var i = 0; i < len; ++i) {
            var $box, toCss = opt.css, j = i;
            if (opt.order == 'randomize') {
                //select a random box and remove it from the elements to choose from
                j = $.OmniSlide.rand($boxes.length);
                $box = $boxes.eq(j);
                $boxes = $boxes.not($box);
            } else { $box = $boxes.eq(j); }

            if (opt.slide == 'next' && opt.css) {
                //if slide is next, then we need to reverse animation
                //so store the current values of whatever css we are changing
                //as the css to animate towards and then assign the specified
                //css to the box now
                toCss = $.OmniSlide.getCss($box, cssKeys);
                $box.css(opt.css);
                //special case where we apply a '-=' or '+=' css
                //we need to reverse that in the toCss
                $.each(opt.css, reverseCSS);
            }

            //if (i == len - 1) data.cb = transitionDone;
            //} else {
                //j = (opt.order == 'randomize') ? $boxes.eq(0) : $boxes.eq(i);
                //$box.data('animData', { opt: opt, toCss: toCss, cb: transitionDone });
                //.delay((opt.delay * i), 'omnislide.transition')
                //.queue('omnislide.transition', doAnim)
                //.dequeue('omnislide.transition');
            //}
            
            $box.data('animData', { opt: opt, toCss: toCss, cb: (i == len-1) ? transitionDone : undefined })
                .delay((opt.delay * i), 'omnislide.transition')
                .queue('omnislide.transition', doAnim)
                .dequeue('omnislide.transition');
        }

        function doAnim(next) {
            var $this = $(this),
                data = $this.data('animData');

            if (!data) { $.OmniSlide.error('Error, animation data empty'); return; }

            if (data.opt.animation && $.isFunction(data.opt.animation)) {
                data.opt.animation.call(this, data.toCss, data.opt, data.cb);
            } else {
                $(this).animate(data.toCss, data.opt.duration, data.opt.easing, data.cb);
            }
            next();
        }

        function transitionDone() {
            if (opt.slide == 'next') {
                api._deactivate($slides.eq(index));
                api._activate($slides.eq(next));
            }
            $wrapper.remove();

            if (callback) callback(next);
        }
    },
    _boxifySlide: function ($slide, rows, cols, guid) {
        var slideW = $slide.width(), slideH = $slide.height(),
        w = slideW / cols, h = slideH / rows,
        $boxes = $(), $wrapper,
        api = $.OmniSlide.transitionAPI;

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
                    .append($contents);

                $boxes = $boxes.add($box);
            }
        }
        $wrapper = $('<div class="slide-transition-box-wrapper" id="slider-transition-box-wrapper-' + guid + '"/>')
            .css({
                height: slideH,
                width: slideW
            })
            .append($boxes);

        return [$boxes, $wrapper];
    }
};

$.OmniSlide.transitionAPI.transitions = {
    fadeOut: {
        css: { opacity: 0 },
        delay: 75,
        duration: 800,
        rows: 3,
        cols: 8,
        order: 'random',
        easing: 'easeInSine',
        slide: 'this'
    },
    rowShrinkOut: {
        css: { opacity: 0, width: 0, height: 0 },
        duration: 1100,
        delay: 85,
        cols: 1,
        rows: 8,
        order: 'normal',
        easing: 'easeInSine',
        slide: 'this'
    },
    shrinkOut: {
        css: {
            top: '-=50',
            left: '-=50',
            width: 0,
            height: 0,
            opacity: 0
        },
        duration: 900,
        delay: 75,
        cols: 8,
        rows: 3,
        order: 'random',
        easing: 'swing',
        slide: 'this'
    },
    flyIn: {
        css: {
            left: function (opt) {
                var p;
                if (opt.direction.indexOf('left') > -1) p = '-=';
                else if (opt.direction.indexOf('right') > -1) p = '+=';
                else { return '-=0'; }

                return (p + ($(this).parent().width() + $(this).width() + 1) + 'px');
            },
            top: function (opt) {
                var p;
                if (opt.direction.indexOf('top') > -1) p = '-=';
                else if (opt.direction.indexOf('bottom') > -1) p = '+=';
                else { return '-=0'; }

                return (p + ($(this).parent().height() + $(this).height() + 1) + 'px');
            }
        },
        delay: 100,
        duration: 1500,
        rows: 3,
        cols: 8,
        order: 'random',
        easing: 'easeInOutBack',
        slide: 'next',
        direction: 'random'
    }
};
$.OmniSlide.transitionAPI.transitions.colShrinkOut = $.extend(true, {}, $.OmniSlide.transitionAPI.transitions.rowShrinkOut);
$.OmniSlide.transitionAPI.transitions.colShrinkOut.cols = 8;
$.OmniSlide.transitionAPI.transitions.colShrinkOut.rows = 1;

//    //Transition extension example
//    (function($, window, undefined) {
//        var api = $.OmniSlide.transitionAPI;
//
//        $.extend(api.transitions, {
//            cut: {
//                //values here are overriden by values input to
//                //the plugin so the values you put here are defaults
//                duration: 1,         //time it takes for each box to animate (in ms)
//                delay: 1,            //delay between each box's animation sequence (in ms)
//                css: { opacity: 0 }, //the CSS to apply as the animation
//                cols: 1,             //cols of boxes the slide is cut into
//                rows: 1,             //rows of boxes the slide is cur into
//                order: 'normal',     //the order to iterate through the slides when animating
//                easing: 'linear',    //the easing to use for the animation
//                slide: 'this'        //the slide the animation operates on if
//                //NOTE: if slide is set to 'this' then the animation engine will animate using your css
//                //variable as an ending point. If slide is set to 'next' then the animation engine reverses
//                //that process; that is the boxes start at your specified css and work towards what
//                //they were before your css is applied
//            },
//            advancedCss: {
//                //sometimes simple values for css isn't enough, you can specify a
//                //function for any CSS property and it will be evaluated for each box
//                css: {
//                    //here 'this' is the DOM element refering to the box, and opt is the full
//                    //options variable for this transition (after user settings are applied)
//                    left: function (opt) {
//                        var p;
//                        if (opt.direction.indexOf('left') > -1) p = '-=';
//                        else if (opt.direction.indexOf('right') > -1) p = '+=';
//                        else { return '-=0'; }
//
//                        return (p + ($(this).parent().width() + $(this).width() + 1) + 'px');
//                    },
//                    top: function (opt) {
//                        var p;
//                        if (opt.direction.indexOf('top') > -1) p = '-=';
//                        else if (opt.direction.indexOf('bottom') > -1) p = '+=';
//                        else { return '-=0'; }
//
//                        return (p + ($(this).parent().height() + $(this).height() + 1) + 'px');
//                    }
//                },
//                delay: 100,
//                duration: 1500,
//                rows: 3,
//                cols: 8,
//                order: 'random',
//                easing: 'easeInOutBack',
//                slide: 'next',
//                direction: 'random'      //direction is an optional variable that is not used by the animations engine
//            },
//            advanced: {
//                //if your transition is more advanced than simple css
//                //manipulation you can specify an animation function
//                //to be called instead of the default $.animate(css)
//                anim: function(toCss, opt, callback) {
//                    //the 'this' arg is the DOM element to manipulate
//                    //the 'toCss' arg is the CSS to animate towards (if css was specified)
//                    //the 'opt' arg the transition options variable
//                    //the 'callback' arg if passed is the callback to execute AFTER all animations complete.
//                    //    If callback is passed, then this is the last box to operate on.
//
//                    //the opt variable passed is the transition options
//                    //object, which has been extended into this object.
//                    //The 'advanced' object in this case
//                    $(this).animate(toCss, opt.duration, opt.easing, function() {
//                        //always check if a callback was passed,
//                        //and if so be sure to call it AFTER YOUR
//                        //ANIMATIONS COMPLETE. Not doing so will
//                        //prevent the slider from continuing after the transition
//                        if(callback) callback();
//                    });
//                },
//                delay: 100,
//                duration: 1000,
//                rows: 6,
//                cols: 6,
//                order: 'normal',
//                easing: 'linear',
//                slide: 'this'
//            }
//        });
//    })(jQuery, window);
/*
 * Each transition has its own options, but they follow the format:
 * OmniSlide.transition(options);
 * WHERE options contains ATLEAST
    {
        type: 'fade',       //the type of transition to use
        effect: 'full',     //specific transition effect (like 'wave' or 'zipper', for type 'strips')
        easing: 'linear',   //the type of easing to use on animations
        direction: '',      //affects only certain effects direction (like 'down', 'up', 'left', 'right', or 'random')

        wait: 5000,         //the wait time to show each slide 
        length: 1000,       //how long the transition animates
        animatorNum = 15,   //applies to strips/boxes; is the number of strips/boxes
    }
*/

(function ($, win, undefined) {
    win.OmniSlide.transition = function (opts, $slides, index, next, callback) {
        //store vars locally for easier access and to lose references
        var trans = OmniSlide.transitions,
            directions = ['down', 'left', 'up', 'right'],
            options = $.extend(true, {}, opts),
            def;

        //setup some reasonable defaults
        options.easing = options.easing || 'linear';
        options.wait = options.wait || 5000;
        options.length = options.length || 500;
        options.animatorNum = options.animatorNum || 15;

        if (!options.type || options.type == 'random') {
            var types = OmniSlide._getKeys(trans);
            options.type = types[parseInt((Math.random() * types.length) % types.length)];
        }
        
        if (!options.effect || options.effect == 'random') {
            var effects = OmniSlide._getKeys(trans[options.type]);
            options.effect = effects[parseInt((Math.random() * effects.length) % effects.length)];
        }

        if (!options.easing || options.easing == 'random') {
            var easings = OmniSlide._getKeys($.easing);
            options.easing = easings[parseInt((Math.random() * easings.length) % easings.length)];
        }

        if (!options.direction || options.direction == 'random')
            options.direction = directions[parseInt((Math.random() * directions.length) % directions.length)];

        def = trans._defaults[options.type];
        if (trans[options.type] && options.type.charAt(0) != '_') {
            //attempt to call transition effect, or default
            if (trans[options.type][options.effect] && options.effect.charAt(0) != '_') {
                return trans[options.type][options.effect]($slides, index, next, options, callback);
            }

            if(trans[options.type][def]) {
                OmniSlide.warn('Unable to find effect %s in transition %s, using default effect %s', options.effect, options.type, def);
                return trans[options.type][def]($slides, index, next, options, callback);
            }
        }

        //no transition found, or no default found
        OmniSlide.error('Unable to find transition %s or its default effect, using transition fade:full', options.type);
        return trans.fade.full($slides, index, next, options, callback);
    };

    //definition of all transition functions
    //in the global object so they can be extended
    //externally
    win.OmniSlide.transitions = {
        _css: {
            box: { 
                position: 'absolute',
                zIndex: 7,
                overflow: 'hidden',
                background: '0 0 no-repeat'
            },
            slide: { zIndex: 3 },
            activeSlide: { zIndex: 4 }
        },
        _orientation: { HORIZONTAL_STRIP: 0, VERTICLE_STRIP: 1, SQUARE: 2 },
        _activate: function($slide) {
            $slide.addClass('active').css(OmniSlide.transitions._css.activeSlide);
        },
        _deactivate: function($slide) {
            $slide.removeClass('active').css(OmniSlide.transitions._css.slide);
        },
        _boxify: function ($slide, num, guid, orientation) {
            var slideW = $slide.width(), slideH = $slide.height(),
                boxW, boxH, xNum, yNum,
                $boxes = $(), gap, sumLeft, sumTop,
                trans = OmniSlide.transitions;

            switch (orientation) {
                case trans._orientation.HORIZONTAL_STRIP:
                    boxW = slideW;
                    boxH = parseInt(slideH / num);
                    gap = slideH - (boxH * num);
                    xNum = 1;
                    yNum = num;
                    break;
                case trans._orientation.VERTICLE_STRIP:
                    boxW = parseInt(slideW / num);
                    boxH = slideH;
                    gap = slideW - (boxW * num);
                    yNum = 1;
                    xNum = num;
                    break;
                case trans._orientation.SQUARE:
                default:
                    var area = slideW * slideH,
                        boxArea = parseInt(area / num),
                        sideLen = parseInt(Math.sqrt(boxArea));

                    boxW = boxH = sideLen;
                    xNum = parseInt(slideW / sideLen);
                    yNum = parseInt(slideH / sideLen);
                    //gap = area - (boxArea * num); //theoretical gap
                    gap = area - ((xNum * yNum) * boxArea); //actual gap
                    break;
            }

            //create boxes and set them up
            sumLeft = sumTop = 0;
            for (var y = 0; y < yNum; ++y) {
                for (var x = 0; x < xNum; ++x) {
                    var w, h, $box, $contents;

                    if (gap > 0) {
                        switch (orientation) {
                            case trans._orientation.HORIZONTAL_STRIP:
                                w = boxW;
                                h = boxH + 1;
                                gap--;
                                break;
                            case trans._orientation.VERTICLE_STRIP:
                                w = boxW + 1;
                                h = boxH;
                                gap--;
                                break;
                            case trans._orientation.SQUARE:
                            default:
                                w = boxW + 1;
                                h = boxH + 1;
                                gap -= 2;
                                break;
                        }
                    } else {
                        w = boxW;
                        h = boxH;
                    }

                    $contents = $('<div class="slider-transition-box-contents" id="slider-transition-box-contents-' + guid + '_' + x + '-' + y + '"></div>')
                        .css({
                            width: w,
                            height: h,
                            left: sumLeft,
                            top: sumTop,
                            //marginLeft: -sumLeft,
                            //marginTop: -sumTop,
                            backgroundPosition: (-(sumLeft)) + 'px ' + (-(sumTop)) + 'px',
                            backgroundImage: $slide.css('backgroundImage')
                        }).html($slide.html());

                    $box = $('<div class="slider-transition-box" id="slider-transition-box-' + guid + '_' + x + '-' + y + '"></div>')
                        .css({
                            width: w,
                            height: h,
                            left: sumLeft,
                            top: sumTop,
                            //backgroundImage: $slide.css('backgroundImage'),
                            //backgroundPosition: (-sumLeft) + 'px ' + (-sumTop) + 'px'
                        })//.html($slide.html());
                        .css(trans._css.box)
                        .append($contents);

                    $boxes = $boxes.add($box);

                    switch (orientation) {
                        case trans._orientation.HORIZONTAL_STRIP:
                            sumTop += h;
                            break;
                        case trans._orientation.VERTICLE_STRIP:
                            sumLeft += w;
                            break;
                        case trans._orientation.SQUARE:
                        default:
                            sumLeft = (x === 0) ? 0 : sumLeft + w;
                            sumTop = (y === 0) ? 0 : sumTop + h;
                            break;
                    }
                }
            }

            $slide.parent().append($boxes.hide());
            return $boxes;
        },
        strips: {
            _getStripOrient: function(dir) {
                if (dir == 'right' || dir == 'left')
                    return OmniSlide.transitions._orientation.VERTICLE_STRIP;
                else
                    return OmniSlide.transitions._orientation.HORIZONTAL_STRIP
            },
            wave: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions,
                    $boxes = trans._boxify($slides.eq(index), options.animatorNum, 
                        options.guid, trans.strips._getStripOrient(options._dir));

                $boxes.show();
                $slides.eq(index).hide();
                $slides.eq(next).show();

                if(options._dir == 'left' || options._dir == 'up')
                    fadeWave($boxes.length - 1, function(i) { return --i; });
                else
                    fadeWave(0, function(i) { return ++i; });

                function fadeWave(i, modify) {
                    if (i >= $boxes.length || i < 0) {
                        $boxes.remove();
                        callback();
                        return;
                    }

                    $boxes.eq(i).animate({ opacity: 0 }, ((options.length / $boxes.length) * 2), options.easing);

                    setTimeout(function () { fadeWave(modify(i), modify); }, (options.length / $boxes.length));
                }
            },
            zipper: function ($slides, index, next, options, callback) {
            
            },
            curtain: function ($slides, index, next, options, callback) { }
        },
        boxes: {
            diagonal: function ($slides, index, next, options, callback) { },
            row: function ($slides, index, next, options, callback) { },
            random: function ($slides, index, next, options, callback) { }
        },
        fade: {
            full: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions;

                $slides.eq(next).show();
                $slides.eq(index).fadeOut(options.length, options.easing, function () {
                    trans._deactivate($slides.eq(index));
                    trans._activate($slides.eq(next));

                    if (callback) callback();
                });
            },
            directional: function ($slides, index, next, options, callback) { }
        },
        cut: {
            full: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions;

                $slides.eq(index).hide();
                trans._deactivate($slides.eq(index));
                $slides.eq(next).show();
                trans._activate($slides.eq(next));

                if (callback) callback();
            }
        }
    };

    win.OmniSlide.transitions._defaults = {
        strips: 'wave',
        boxes: 'random',
        fade: 'full',
        cut: 'full'
    };

//    //Transition extension example
//    (function($, window, undefined) {
//        var trans = OmniSlide.transitions;

//        $.extend(true, trans, {
//            cut: {
//                full: function ($slides, index, next, options, callback) {
//                    $slides.eq(index).hide();
//                    trans._deactivate($slides.eq(index));
//                    $slides.eq(next).show();
//                    trans._activate($slides.eq(next));

//                    if (callback) callback();
//                }
//            },
//            defaults: {
//                cut: 'full'
//            }
//        });
//    })(jQuery, window);
})(jQuery, window);
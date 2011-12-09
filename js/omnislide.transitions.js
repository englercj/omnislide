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

        if (!options.type) {
            var types = OmniSlide._getKeys(trans);
            options.type = types[OmniSlide._rand(types.length)];
        }
        
        if (!options.effect) {
            var effects = OmniSlide._getKeys(trans[options.type]);
            options.effect = effects[OmniSlide._rand(effects.length)];
        }

        if (!options.easing) {
            var easings = OmniSlide._getKeys($.easing);
            options.easing = easings[OmniSlide._rand(easings.length)];
        }

        if (!options.direction) {
            var r = OmniSlide._rand(directions.length);
            options.direction = directions[r];
            console.log(options.direction, r);
        }

        //special case that type is custom
        if (options.type == 'custom' && typeof(options.effect) === 'function') {
            return options.effect($slides, index, next, options, callback);
        }

        def = trans._defaults[options.type];
        if (trans[options.type] && options.type.charAt(0) != '_') {
            //attempt to call transition effect, or default
            if (trans[options.type][options.effect] && options.effect.charAt(0) != '_') {
                return trans[options.type][options.effect]($slides, index, next, options, callback);
            }

            if(trans[options.type][def]) {
                OmniSlide.warn('Unable to find effect "%s" in transition "%s", using default effect "%s"', options.effect, options.type, def);
                return trans[options.type][def]($slides, index, next, options, callback);
            }
        }

        //no transition found, or no default found
        OmniSlide.warn('Unable to find transition "%s" or its default effect, using transition fade:full', options.type);
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
        _orientation: { HORIZONTAL_STRIP: 0, VERTICAL_STRIP: 1, SQUARE: 2 },
        _activate: function($slide) {
            $slide.show().addClass('active').css(OmniSlide.transitions._css.activeSlide);
        },
        _deactivate: function($slide) {
            $slide.hide().removeClass('active').css(OmniSlide.transitions._css.slide);
        },
        _animCallback: function(i, end, $boxes, callback) {
            if (i == end) {
                $boxes.remove();

                if(callback) callback();
                return;
            }
        },
        _animMoveIndex: function(i, end) {
            if(i < end) ++i; else if(i > end) --i; else return false;

            return i;
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
                case trans._orientation.VERTICAL_STRIP:
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
                            case trans._orientation.VERTICAL_STRIP:
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
                        case trans._orientation.VERTICAL_STRIP:
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
            wipe: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions,
                    orient, $boxes, done = 0, dir = options.direction;

                if (dir == 'right' || dir == 'left')
                    orient = OmniSlide.transitions._orientation.VERTICAL_STRIP;
                else
                    orient = OmniSlide.transitions._orientation.HORIZONTAL_STRIP;

                $boxes = trans._boxify($slides.eq(index), options.animatorNum, options.guid, orient);

                $boxes.show();
                trans._deactivate($slides.eq(index));
                trans._activate($slides.eq(next));

                if(dir == 'left' || dir == 'up') fadeWave($boxes.length - 1, 0);
                else fadeWave(0, $boxes.length - 1);

                function fadeWave(i, end) {
                    if(i === false) return;

                    $boxes.eq(i).animate({ opacity: 0 }, ((options.length / $boxes.length) * 2), options.easing, 
                    function() {
                        trans._animCallback(i, end, $boxes, callback);
                    });

                    setTimeout(function () { fadeWave(trans._animMoveIndex(i, end), end); }, (options.length / $boxes.length));
                }
            },
            wave: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions, orient, $boxes, attr, atch,
                    dir = options.direction;

                switch(dir) {
                    case 'up':
                        attr = 'height';
                        atch = 'bottom';
                        orient = OmniSlide.transitions._orientation.VERTICAL_STRIP;
                        break;
                    case 'down':
                        attr = 'height';
                        atch = 'top';
                        orient = OmniSlide.transitions._orientation.VERTICAL_STRIP;
                        break;
                    case 'left':
                        attr = 'width';
                        atch = 'right';
                        orient = OmniSlide.transitions._orientation.HORIZONTAL_STRIP;
                        break;
                    case 'right':
                        attr = 'width';
                        atch = 'left';
                        orient = OmniSlide.transitions._orientation.HORIZONTAL_STRIP;
                        break;
                }

                $boxes = trans._boxify($slides.eq(next), options.animatorNum, options.guid, orient)
                    .css(attr, 0).css(atch, 0).show();

                wave(0, $boxes.length - 1);

                function wave(i, end) {
                    if(i === false) return;

                    var css = {};
                    css[attr] = $slides.eq(next)[attr]();

                    $boxes.eq(i).animate(css, options.length, options.easing, function() {
                        trans._animCallback(i, end, $boxes, animDone);
                    });

                    setTimeout(function () { wave(trans._animMoveIndex(i, end), end); }, 50);
                }

                function animDone() {
                    trans._deactivate($slides.eq(index));
                    trans._activate($slides.eq(next));

                    if(callback) callback();
                }
            },
            zipper: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions, orient, $boxes, attr, atch,
                    dir = options.direction;

                if (dir == 'right' || dir == 'left') {
                    attr = 'height';
                    atch = ['top', 'bottom'];
                    orient = OmniSlide.transitions._orientation.VERTICAL_STRIP;
                } else {
                    attr = 'width';
                    atch = ['left', 'right'];
                    orient = OmniSlide.transitions._orientation.HORIZONTAL_STRIP;
                }

                $boxes = trans._boxify($slides.eq(next), options.animatorNum, options.guid, orient)
                    .each(function(i, elm) {
                        var $box = $(elm);

                        $box.css(attr, 0);
                        $box.css(atch[(i % 2) ^ 1], 'auto');
                        $box.css(atch[i % 2], 0);
                    }).show();
                
                if (dir == 'left' || dir == 'up') zipperWave($boxes.length - 1, 0);
                else zipperWave(0, $boxes.length - 1);

                function zipperWave(i, end) {
                    if(i === false) return;

                    var css = {};
                    css[attr] = $slides.eq(next)[attr]();

                    $boxes.eq(i).animate(css, (options.length / $boxes.length) * 4, options.easing, function() {
                        trans._animCallback(i, end, $boxes, animDone);
                    });
                    i = trans._animMoveIndex(i, end)
                    $boxes.eq(i).animate(css, (options.length / $boxes.length) * 4, options.easing, function() {
                        trans._animCallback(i, end, $boxes, animDone);
                    });

                    setTimeout(function () { zipperWave(trans._animMoveIndex(i, end), end); }, (options.length / $boxes.length));
                }

                function animDone() {
                    trans._deactivate($slides.eq(index));
                    trans._activate($slides.eq(next));

                    if(callback) callback();
                }
            },
            curtain: function ($slides, index, next, options, callback) { }
        },
        boxes: {
            fade: function ($slides, index, next, options, callback) { },
            fly: function ($slides, index, next, options, callback) { },
            shrink: function ($slides, index, next, options, callback) { },
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
            }//,
            //directional: function ($slides, index, next, options, callback) { }
        },
        cut: {
            full: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions;

                trans._deactivate($slides.eq(index));
                trans._activate($slides.eq(next));

                if (callback) callback();
            }
        }
    };

    win.OmniSlide.transitions._defaults = {
        strips: 'wipe',
        boxes: 'random',
        fade: 'full',
        cut: 'full'
    };

//    //Transition extension example
//    (function($, window, undefined) {
//        var trans = OmniSlide.transitions;

//        $.extend(trans, {
//            cut: {
//                full: function ($slides, index, next, options, callback) {
//                    trans._deactivate($slides.eq(index));
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
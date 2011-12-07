/*
 * Each transition has its own options, but they follow the format:
 * OmniSlide.transition(options);
 * WHERE options contains ATLEAST
    {
        type: 'fade',       //the type of transition to use
        effect: 'full',     //specific transition effect (like 'wave' or 'zipper' for 'strips')
        easing: 'linear',   //the type of easing to use on transitions
        direction: '',      //direction the animation goes (like 'down' or 'right')

        wait: 5000,         //the wait time to show each slide 
        length: 1000,       //how long the transition animates
        animatorNum = 15,   //applies to strips/boxes; is the number of strips/boxes
    }
*/

(function ($, win, undefined) {
    win.OmniSlide.transition = function (options, $slides, index, next, callback) {
        //setup some reasonable defaults
        options.easing = options.easing || 'linear';
        options.direction = options.direction || 'down';
        options.wait = options.wait || 5000;
        options.length = options.length || 500;
        options.animatorNum = options.animatorNum || 15;


        //store vars locally for easier access
        var trans = OmniSlide.transitions,
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
            wave: function ($slides, index, next, options, callback) {
                var trans = OmniSlide.transitions,
                    $boxes = trans._boxify($slides.eq(index), options.animatorNum, 
                        options.guid, trans._orientation.VERTICLE_STRIP);
                
                $boxes.show();
                $slides.eq(index).hide();
                $slides.eq(next).show();

                function fadeWave(i) {
                    if (i >= $boxes.length) {
                        $boxes.remove();
                        callback();
                        return;
                    }

                    $boxes.eq(i).animate({ opacity: 0 }, ((options.length / $boxes.length) * 2), options.easing);

                    setTimeout(function () { fadeWave(++i); }, (options.length / $boxes.length));
                }

                fadeWave(0);
            },
            zipper: function ($slides, index, next, options, callback) { },
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
/*
 * Each transition has its own options, but they follow the format:
 * OmniSlide.transition(options);
 * WHERE options contains ATLEAST
    {
        type: 'fade',       //the type of transition to use
        effect: 'full',     //specific transition effect (like 'wave' or 'zipper' for 'strips')
        easing: 'linear',   //the type of easing to use on transitions
        wait: 5000,         //the wait time to show each slide 
        length: 500,        //how long the transition animates
        guid: '',           //the guid used for the ID of the slider

        direction: '',      //direction the animation goes (like 'down' or 'right')
        position: '',       //start position of the animation (like 'top' or 'topleft')

        animatorNum = 20,   //applies to strips/boxes; is the number of strips/boxes
        animatorDelay = 50  //applies ot strips/boxes; delay between each strip/box
    }
*/

(function ($, win, undefined) {
    win.OmniSlide.transition = function (options, $slides, index, next, callback) {
        //setup some reasonable defaults
        options.easing = options.easing || 'linear';
        options.wait = options.wait || 5000;
        options.length = options.length || 500;
        options.direction = options.direction || 'down';
        options.position = options.position || 'top';

        //store vars locally for easier access
        var transitions = OmniSlide.transitions,
            defaults = OmniSlide.transitions.defaults;

        if (transitions[options.type] && options.type.charAt(0) != '_') {
            //check if we did init for this transition yet
            /*if (!transitions[options.type]['_init_done']) {
            transitions[options.type]['_init']();
            OmniSlide.transitions[options.type]['_init_done'] = true;
            }*/

            //attempt to call transition effect, or default
            if (transitions[options.type][options.effect] && options.effect.charAt(0) != '_') {
                return transitions[options.type][options.effect]($slides, index, next, options, callback);
            } else {
                OmniSlide.warn('Unable to find effect %s in transition %s, using default effect %s', options.effect, options.type, options.type);
                return transitions[options.type][defaults[options.type]]($slides, index, next, options, callback);
            }
        } else {
            //no transition found, default to fade
            slide.warn('Unable to find transition %s, defaulting to transition fade:full', options.type);
            return transitions.fade.full($slides, index, next, options, callback);
        }
    };

    //definition of all transition functions
    //in the global object so they can be extended
    //externally
    win.OmniSlide.transitions = {
        _orientation: { HORIZONTAL_STRIP: 0, VERTICLE_STRIP: 1, SQUARE: 2 },
        _boxify: function ($slide, num, guid, orientation) {
            var slideW = $slide.width(), slideH = $slide.height(),
                boxW, boxH, xNum, yNum,
                $boxes = $(), gap, sumLeft, sumTop;

            switch (orientation) {
                case OmniSlide.transitions._orientation.HORIZONTAL_STRIP:
                    boxW = slideW;
                    boxH = parseInt(slideH / num);
                    gap = slideH - (boxH * num);
                    xNum = 1;
                    yNum = num;
                    break;
                case OmniSlide.transitions._orientation.VERTICLE_STRIP:
                    boxW = parseInt(slideW / num);
                    boxH = slideH;
                    gap = slideW - (boxW * num);
                    yNum = 1;
                    xNum = num;
                    break;
                case OmniSlide.transitions._orientation.SQUARE:
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
                            case OmniSlide.transitions._orientation.HORIZONTAL_STRIP:
                                w = boxW;
                                h = boxH + 1;
                                gap--;
                                break;
                            case OmniSlide.transitions._orientation.VERTICLE_STRIP:
                                w = boxW + 1;
                                h = boxH;
                                gap--;
                                break;
                            case OmniSlide.transitions._orientation.SQUARE:
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

                    /*$contents = $('<div class="slider-transition-box-contents" id="slider-transition-box-contents-' + guid + '_' + x + '-' + y + '"></div>')
                    .html($slide.html())
                    .css({
                    width: w,
                    height: h,
                    left: x * w,
                    top: y * h,
                    marginLeft: -(x * w),
                    marginTop: -(y * h),
                    backgroundPosition: (-(x * w)) + 'px ' + (-(y * h)) + 'px',
                    backgroundImage: $slide.css('backgroundImage')
                    });*/
                    console.log(sumLeft, w, sumTop);
                    $box = $('<div class="slider-transition-box" id="slider-transition-box-' + guid + '_' + x + '-' + y + '"></div>')
                        .css({
                            width: w,
                            height: h,
                            left: sumLeft,
                            top: sumTop,
                            backgroundImage: $slide.css('backgroundImage'),
                            backgroundPosition: (-sumLeft) + 'px ' + (-sumTop) + 'px'
                        }).html($slide.html());
                    //.append($contents);

                    $boxes = $boxes.add($box);

                    switch (orientation) {
                        case OmniSlide.transitions._orientation.HORIZONTAL_STRIP:
                            sumTop += h;
                            break;
                        case OmniSlide.transitions._orientation.VERTICLE_STRIP:
                            sumLeft += w;
                            break;
                        case OmniSlide.transitions._orientation.SQUARE:
                        default:
                            sumLeft = (x === 0) ? 0 : sumLeft + w;
                            sumTop  = (y === 0) ? 0 : sumTop + h;
                            break;
                    }
                }
            }

            return $boxes;
        },
        strips: {
            wave: function ($slides, index, next, options, callback) {
                var $boxes = OmniSlide.transitions._boxify($slides.eq(index), options.animatorNum, options.guid,
                    OmniSlide.transitions._orientation.VERTICLE_STRIP);

                $slides.parent().append($boxes);
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
                $slides.eq(next).show();
                $slides.eq(index).fadeOut(options.length, options.easing, function () {
                    $slides.eq(index).removeClass('active');
                    $slides.eq(next).addClass('active');

                    if (callback) callback();
                });
            },
            directional: function ($slides, index, next, options, callback) { }
        },
        cut: {
            full: function ($slides, index, next, options, callback) {
                $slides.eq(index).hide();
                $slides.eq(index).removeClass('active');
                $slides.eq(next).show();
                $slides.eq(next).addClass('active');

                if (callback) callback();
            }
        }
    };

    win.OmniSlide.transitions.defaults = {
        strips: 'wave',
        boxes: 'random',
        fade: 'full',
        cut: 'full'
    };

    /*
    * Transition extension example
    *
    $.extend(true, OmniSlide.transitions, {
    hey: {
    there: function ($slides, index, next, options, callback) {
    OmniSlide.log('Hey There!');

    if(callback) callback();
    }
    },
    defaults: {
    hey: 'there'
    }
    });
    */
})(jQuery, window);
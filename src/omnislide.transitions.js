(function ($, window, undefined) {
    var trans = $.OmniSlide.transitionAPI.transitions;

    jQuery.extend(trans, {
        flyLeft: {
            duration: 1100,
            delay: 80,
            css: {
                opacity: 0,
                left: '-=200'
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        flyTop: {
            duration: 1100,
            delay: 80,
            css: {
                top: '-=200',
                opacity: 0
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        flyLeftGrowIn: {
            duration: 1000,
            delay: 80,
            css: {
                width: 0,
                opacity: 0,
                left: '-=200'
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'swing',
            slide: 'next'
        },
        growIn: {
            duration: 1000,
            delay: 80,
            css: {
                top: '-=50',
                left: '-=50',
                width: 0,
                height: 0,
                opacity: 0
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'swing',
            slide: 'next'
        },
        growRandomIn: {
            duration: 1000,
            delay: 80,
            css: {
                top: '-=50',
                left: '-=50',
                width: 0,
                height: 0,
                opacity: 0
            },
            cols: 8,
            rows: 3,
            order: 'randomize',
            easing: 'easeInSine',
            slide: 'next'
        },
        shrinkRaiseIn: {
            duration: 1000,
            delay: 80,
            css: {
                height: 0,
                top: '+=100',
                opacity: 0
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'next'
        },
        fallIn: {
            duration: 1200,
            delay: 100,
            css: {
                height: 0,
                opacity: 0
            },
            cols: 8,
            rows: 3,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'next'
        },
        rowFade: {
            duration: 800,
            delay: 100,
            css: {
                opacity: 0
            },
            cols: 1,
            rows: 8,
            order: 'normal',
            easing: 'easeInSine',
            slide: 'this'
        },
        rowGrowIn: {
            duration: 1600,
            delay: 120,
            css: {
                opacity: 0,
                width: 0,
                height: 0
            },
            cols: 1,
            rows: 6,
            order: 'normal',
            easing: 'easeInSine',
            slide: 'next'
        },
        rowFlyLeft: {
            duration: 800,
            delay: 100,
            css: {
                left: '-=500',
                opacity: 0
            },
            cols: 1,
            rows: 6,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        rowRandomGrowIn: {
            duration: 1600,
            delay: 120,
            css: {
                height: 0,
                opacity: 0,
                width: 0
            },
            cols: 1,
            rows: 6,
            order: 'randomize',
            easing: 'easeInSine',
            slide: 'next'
        },
        colFade: {
            duration: 800,
            delay: 80,
            css: {
                opacity: 0
            },
            cols: 12,
            rows: 1,
            order: 'normal',
            easing: 'easeInSine',
            slide: 'this'
        },
        colDrop: {
            duration: 800,
            delay: 100,
            css: {
                top: '+=300',
                opacity: 0
            },
            cols: 12,
            rows: 1,
            order: 'normal',
            easing: 'easeInSine',
            slide: 'this'
        },
        colFlyTop: {
            duration: 800,
            delay: 100,
            css: {
                top: '-=300',
                opacity: 0
            },
            cols: 12,
            rows: 1,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        colRandomGrowIn: {
            duration: 800,
            delay: 100,
            css: {
                opacity: 0,
                width: 0,
                height: 0
            },
            cols: 12,
            rows: 1,
            order: 'randomize',
            easing: 'easeInSine',
            slide: 'next'
        },
        slideTop: {
            duration: 1200,
            delay: 0,
            css: {
                top: '-=500',
                opacity: 0
            },
            cols: 1,
            rows: 1,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        slideLeft: {
            duration: 1200,
            delay: 0,
            css: {
                left: '-=800',
                opacity: 0
            },
            cols: 1,
            rows: 1,
            order: 'normal',
            easing: 'easeInOutBack',
            slide: 'this'
        },
        evaporate: {
            duration: 1700,
            delay: 30,
            css: {
                top: '-=100',
                opacity: 0
            },
            cols: 12,
            rows: 5,
            order: 'randomize',
            easing: 'linear',
            slide: 'this'
        }
    });

    //define some opposites
    trans['shrinkOut'] = $.extend(true, {}, trans.growIn);
    trans['shrinkOut'].slide = 'this';

    trans['rowShrinkOut'] = $.extend(true, {}, trans.rowGrowIn);
    trans['rowShrinkOut'].slide = 'this';

    trans['shrinkRandomOut'] = $.extend(true, {}, trans.growRandomIn);
    trans['shrinkRandomOut'].slide = 'this';

    trans['rowRandomShrinkOut'] = $.extend(true, {}, trans.rowRandomGrowIn);
    trans['rowRandomShrinkOut'].slide = 'this';

    trans['colRandomShrinkOut'] = $.extend(true, {}, trans.colRandomGrowIn);
    trans['colRandomShrinkOut'].slide = 'this';

    trans['shrinkDropOut'] = $.extend(true, {}, trans.shrinkRaiseIn);
    trans['shrinkDropOut'].slide = 'this';

    trans['flyRight'] = $.extend(true, {}, trans.flyLeft);
    trans['flyRight'].css.left = '+=200';

    trans['flyBottom'] = $.extend(true, {}, trans.flyTop);
    trans['flyBottom'].css.top = '+=200';

    trans['rowFlyRight'] = $.extend(true, {}, trans.rowFlyLeft);
    trans['rowFlyRight'].css.left = '+=500';

    trans['colFlyBottom'] = $.extend(true, {}, trans.colFlyTop);
    trans['colFlyBottom'].css.top = '+=300';

    trans['slideRight'] = $.extend(true, {}, trans.slideLeft);
    trans['slideRight'].css.left = '+=800';

    trans['slideBottom'] = $.extend(true, {}, trans.slideTop);
    trans['slideBottom'].css.top = '+=500';
})(jQuery, window);
/*
 * options variable
   {
        height: '45px', //height of the timer
        width: '45px',  //width of the timer
        colors: {
            empty: 'rgba(10, 10, 10, 0.2)',     //color to show on unfilled time
            filled: 'rgba(100, 100, 100, 0.3)'  //color to show as ellapsed time
        },
        refreshRate: 50,
        ringWidth: 10,
        style: 'ring'   //style of the timer; circle, ring, bar
    }
 */

(function (win, undefined) {
    win.slideTimer = function (animLen, options, callback, canvas) {
        if (!canvas)
            canvas = document.createElement('canvas');

        //init canvas
        canvas.height = options.height;
        canvas.width = options.width;
        canvas.className = 'slide-timer';

        var ctx = canvas.getContext('2d'),

        midX = canvas.width / 2,
        midY = canvas.height / 2,

        timeEllapsed = 0,

        //radianStart = Math.PI - 0.5,
        radianMax = Math.PI * 2,
        radius = canvas.width / 2,
        lastRad = 0,

        border = 2,

        paintLoop = null,
        timeLoop = null,

        //paint background
        bgPaint = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = options.colors.empty;
            ctx.strokeStyle = options.colors.empty;

            switch (options.style) {
                case 'bar':
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(midX, midY, radius, 0, radianMax, false);
                    ctx.fill();
                    break;
                default: //ring
                    ctx.beginPath();
                    ctx.arc(midX, midY, radius - options.ringWidth / 2 - border, 0, radianMax, false);
                    ctx.lineWidth = options.ringWidth + (border * 2);
                    ctx.stroke();
                    break;
                    break;
            }
        },

        //paint forground based on % done
        fgPaint = function () {
            var prct = timeEllapsed / animLen;
            ctx.fillStyle = options.colors.filled;
            ctx.strokeStyle = options.colors.filled;

            switch (options.style) {
                case 'bar':
                    var w = (canvas.width * prct) - (border * 2);

                    w = (w < 0) ? 0 : w;
                    ctx.clearRect(border, border, w, canvas.height - (border * 2));
                    ctx.fillRect(border, border, w, canvas.height - (border * 2));
                    break;
                case 'circle':
                    var rads = (radianMax * prct) - lastRad;

                    ctx.beginPath();
                    ctx.moveTo(midX, midY);
                    ctx.arc(midX, midY, radius, lastRad, lastRad + rads, false);
                    ctx.fill();

                    lastRad = lastRad + rads;
                    break;
                default:
                    var rads = (radianMax * prct) - lastRad;

                    ctx.beginPath();
                    ctx.arc(midX, midY, radius - (options.ringWidth / 2) - border, lastRad, lastRad + rads, false);
                    ctx.lineWidth = options.ringWidth;
                    ctx.stroke();

                    lastRad = lastRad + rads;
                    break;
            }
        },

        //clear canvas
        clearCanvas = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        trackTime = function () {
            if (timeEllapsed == animLen) {
                timer.stop();
                callback();
                return;
            }

            timeEllapsed += 10;
        },

        timer = {
            setTimeLeft: function (time) {
                if (time > animLen || time < 0) return false;

                timeLeft = time;
                paint();
                return true;
            },
            start: function () {
                //drawRing(midX, midY, canvas.width / 2, options.ringWidth, 40, 3 * Math.PI);
                paintLoop = setInterval(fgPaint, options.refreshRate);
                timeLoop = setInterval(trackTime, 10); //once a second
            },
            stop: function () {
                clearInterval(paintLoop);
                clearInterval(timeLoop);
            },
            reset: function () {
                clearCanvas();
                timeEllapsed = 0;
                bgPaint();
            },
            canvas: canvas
        };

        timer.reset();

        //Public Interface
        return timer;
    }
})(window);
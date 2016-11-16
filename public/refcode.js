var audioContext;
var receivedAudio = new Array();
var source = new Array();
window.addEventListener('load', init, false);

//Event Declaration
function init() {
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        audioContext = new AudioContext();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }
}

// UI Event Define
function addList(name){
    var output;
    output+= '<p>' + name + '<input type="checkbox">';
}

//jquery Ajax event
$(document).ready(function () {
    //Click Submit Button
    $('#music_getmusic').submit(function (e) { 
        e.preventDefault();
        //url
        var name = $('#music_musicname').val();
        
        //req define
        var request = new XMLHttpRequest();
        request.open('GET', '/gettingmusic/'+name, true);
        request.responseType = 'arraybuffer';
        
        // Decode asynchronously
        request.onload = function() {
            if(!request.response){
                alert('No Audio File');
            }
            else{
                audioContext.decodeAudioData(request.response, function(buffer) {
                    drawAudioWave(buffer);
                    receivedAudio.push(buffer);
                }, function (error){
                    alert(error);
                });
            }
            console.log('Decode End');
        }
        request.send();
    });

    //Click Play Button
    $('#music_play').click(function (e) { 
        e.preventDefault();
        var i = 0;
        receivedAudio.forEach(function(element) {
            source[i] = audioContext.createBufferSource();
            source[i].buffer = receivedAudio[i];
            source[i].connect(audioContext.destination);
            source[i].start(0);
            i++;
            drawbar();
        }, this);
    });

    $('#music_stop').click(function (e) { 
        e.preventDefault();
        source.forEach(function(element) {
            element.stop(0);
        }, this);
    });
});

function drawbar() {
    var x=0;
    var canvas = document.querySelector('canvas');
    var canvasContext = canvas.getContext('2d');
    canvasContext.fillStyle="black";
    canvasContext.beginPath();
    canvasContext.arc(x,-127,15,0,Math.PI*2,true);
    canvasContext.closePath();
    canvasContext.fill();
    x++;
}

//Draw function
function drawAudioWave(audioBuffer) {
    // Get binary data
    var channelLs = new Float32Array(audioBuffer.length);
    var channelRs = new Float32Array(audioBuffer.length);

    // Stereo check
    if(audioBuffer.numberOfChannels > 1) {
        channelLs.set(audioBuffer.getChannelData(0));
        channelRs.set(audioBuffer.getChannelData(1));
    }else if(audioBuffer.numberOfChannels> 0) {
        channelLs.set(audioBuffer.getChannelData(0));
    }else{
        window.alert( 'The number of channels is invalid.');
        return;
    }
    console.log(channelLs);

    var canvas = document.querySelector('canvas');
    var canvasContext = canvas.getContext('2d');

    var width = canvas.width;
    var height = canvas.height;

    // Sampling period
    var period = 1 / audioContext.sampleRate;

    // The number of samples during 50 msec
    var n50msec = Math.floor(50 * Math.pow(10, -3) * audioContext.sampleRate);

    // Clear previous data
    canvasContext.clearRect(0, 0, width, height);

    // Draw audio wave
    canvasContext.beginPath();

    var Rectlen = 0;
    console.log(Rectlen);
    for(var i = 0, len = channelLs.length; i <len; i ++) {
        if ((i % n50msec) === 0){
            var x = (i / len) * width;
            var y = 127*channelLs[i]+127; // 0~255
            var w = 2.983219954648526;
            canvasContext.fillStyle='yellow';
            canvasContext.fillRect(x,height,w,-y+127);
            canvasContext.shadowOffsetX=0.5;
            canvasContext.shadowOffsetY=0.5;
            canvasContext.shadowColor='red';
            Rectlen++;
        }
    }
    console.log(Rectlen);
    console.log(Rectlen/n50msec);
    canvasContext.stroke ();
};
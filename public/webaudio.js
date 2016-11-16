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
        }, this);
    });

    $('#music_stop').click(function (e) { 
        e.preventDefault();
        source.forEach(function(element) {
            element.stop(0);
        }, this);
    });

    $('#music_print').click(function (e) { 
        e.preventDefault();
        $.ajax({
            url: "data.json",
            dataType: "text",
            success: function (response) {
                var json = $.parseJSON(jsonObject);
            }
        });
    });


});

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
    // Sound Monolize
    var channelData = {
        height: 255,
        width: 3000,
        samples: []
    }
    var audioSampleLength = channelLs.length;
    var channelDataDistance = Math.floor(audioSampleLength / channelData.width);

    // Get Sound Sample Peaks
    for(var i = 0 ; i < channelData.width ; i ++){
        for(var j = 0, buffer = 0 ; j < channelDataDistance ; j++){
            buffer += ((Math.abs(channelLs[channelDataDistance * i + j]) + Math.abs(channelRs[channelDataDistance * i + j]))/2) * channelData.height;
        }
        // Mean
        channelData.samples[i] = Math.round(buffer / channelDataDistance);
    }

    /* Waveform Print Logic */
    // json download logic
    var jsonData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(channelData));
    $('#music_download > *').remove();
    $('<a href="data:' + jsonData + '" download="data.json">download JSON</a>').appendTo('#music_download');
    initCanvas(channelData);
    modifyCanvas(channelData);
};

function initCanvas(channelData) {
    // Find Sample max Peak
    var maxPeak = channelData.samples.reduce(function (previous, current) { 
        return previous > current ? previous:current;
    });

    // ready to draw
    var canvas = document.getElementById('canvas-layer1');
    var canvasContext = canvas.getContext('2d');
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var boxWidth = 1;
    var boxSpace = 0;
    var boxNumber = Math.floor(canvasWidth / (boxWidth+boxSpace));
    
    // Get scaling coefficient
    var scalingCoefficent = canvasHeight / maxPeak;

    // Draw
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    canvasContext.fillStyle = 'gray';

    for(var i = 0 ; i < boxNumber ; i++){
        // i-th sample magnitude (정규화 X)
        var sampleMagnitude = channelData.samples[Math.floor((channelData.samples.length/boxNumber) * i)] * scalingCoefficent;
        // x : (sample X Start Position)
        // y : (canvas height - sample Height)
        canvasContext.fillRect((boxWidth+boxSpace) * i, canvasHeight - sampleMagnitude, boxWidth, canvasHeight);
    }
}

function modifyCanvas(channelData) {
    // Find Sample max Peak
    var maxPeak = channelData.samples.reduce(function (previous, current) { 
        return previous > current ? previous:current;
    });

    var canvas = document.getElementById('canvas-layer2');
    var canvasContext = canvas.getContext('2d');
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var boxWidth = 1;
    var boxSpace = 0;
    var boxNumber = Math.floor(canvasWidth / (boxWidth+boxSpace));

    // Get scaling coefficient
    var scalingCoefficent = canvasHeight / maxPeak;
    
    // Event
    var mouseX;
    var mouseY;

    canvas.addEventListener('mousemove', function(event){
        if(event.layerX || event.layerX == 0){
            mouseX = event.layerX;
            mouseY = event.layerY;
        }
        else if(event.offsetX || event.offsetX == 0){
            mouseX = event.offsetX;
            mouseY = event.offsetY;
        }
        $('#mouseX').val(mouseX);
        $('#mouseY').val(mouseY);
    });
    canvas.addEventListener('click',function (event) {
        var clickRatio =  mouseX / canvasWidth;
        canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
        canvasContext.fillStyle = 'orange';
        for(var i = 0 ; i < Math.floor(boxNumber * clickRatio) ; i++){
            // i-th sample magnitude (정규화 X)
            var sampleMagnitude = channelData.samples[Math.floor((channelData.samples.length/boxNumber) * i)] * scalingCoefficent;
            // x : (sample X Start Position)
            // y : (canvas height - sample Height)
            canvasContext.fillRect((boxWidth+boxSpace) * i, canvasHeight - sampleMagnitude, boxWidth, canvasHeight);
        }
    });
}
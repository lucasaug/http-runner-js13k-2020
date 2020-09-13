export let get_audio_context = function() {
    var ac = null;
    if ( !window.AudioContext && !window.webkitAudioContext ) {
        console.warn('Web Audio API not supported in this browser');
    } else {
        ac = new ( window.AudioContext || window.webkitAudioContext )();
    }
    return function() {
        return ac;
    };
}();

export let play_sine = function(freq) {
    var audio_context = get_audio_context();
    var o = audio_context.createOscillator();
    var g = audio_context.createGain();
    o.connect(g);
    g.connect(audio_context.destination);
    o.frequency.value = freq;
    o.type = 'sine';
    o.start(0);
    g.gain.value = 0.1;
    g.gain.exponentialRampToValueAtTime(
        0.00000001, audio_context.currentTime + 0.2
    )
    setTimeout(function () {
        o.stop();
        o.disconnect();
    }, 200);
}

export let play_melody = function(melody, initial_delay, interval) {
    var audio_context = get_audio_context();
    var o = audio_context.createOscillator();
    var g = audio_context.createGain();
    o.connect(g);
    g.connect(audio_context.destination);
    g.gain.value = 0.03;
    o.frequency.value = 440;
    o.type = 'square';

    setTimeout(function() {
        o.start(0);
    }, initial_delay);

    for (let i = 0; i < melody.length; i++) {
        setTimeout(function() {
            o.frequency.value = melody[i];
        }, interval * i + initial_delay);
    }
    setTimeout(function() {
        o.stop();
        o.disconnect();
    }, interval * melody.length + initial_delay);
}

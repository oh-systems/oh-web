precision highp float;

varying vec2 vUv;
uniform float u_time;
uniform float u_progress;
uniform float u_aspect;
uniform vec3 u_color;

float sdRing(vec2 p, float r, float w) {
    return abs(length(p) - r) - w * 0.5;
}

float ease(float t) {
    return smoothstep(0.0, 1.0, t);
}

void main() {
    vec2 p = (vUv - 0.5) * vec2(u_aspect, 1.0);

    // Breathing pulse (slower over time as progress rises)
    float basePulse = 0.5 + 0.5 * sin(u_time * mix(1.6, 0.6, u_progress));
    float pulse = mix(0.90, 1.05, basePulse);

    // Map progress → ring params (blur narrows, ring thickens slightly)
    float t = ease(u_progress);
    float radius = mix(0.22, 0.18, t) * pulse;
    float thick = mix(0.02, 0.07, t);
    float blur = mix(0.22, 0.002, t);

    float d = sdRing(p, radius, thick);
    float alpha = 1.0 - smoothstep(-blur, blur, d);
    
    if (alpha < 0.002) discard;
    
    gl_FragColor = vec4(u_color, alpha);
}

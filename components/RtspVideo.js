import { useState, useEffect, useRef } from "react"
import WebRtcStreamer from './webrtcstreamer'

export default function RtstpVideo(props) {
    const ref = useRef(null)
    let [webRtcStreamer, setWebRtcStreamer] = useState(null)
    useEffect(() => {
        if (!webRtcStreamer) {
            webRtcStreamer = new WebRtcStreamer(ref.current, props.WEBRTC_SERVER)
            setWebRtcStreamer(webRtcStreamer)
        }
        
        webRtcStreamer.connect(props.src, props.audio_src || null, `rtptransport=udp&timeout=60&width=${props.width | 320 }&height=${props.height | 240}`)
    }, [props.src, props.WEBRTC_SERVER])

    return <>
        <video ref={ref} autoPlay controls={props.controls}/>
        <style jsx>{`
            video {
                width: 100%;
                max-height: 100vh;
            }
        `}</style>
    </>
}
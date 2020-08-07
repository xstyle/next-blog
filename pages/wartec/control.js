import Head from 'next/head'
import { useRouter, withRouter } from 'next/router'
import UserVideoComponent from '../../components/UserVideoComponent'

import fetch from 'node-fetch'
import RtstpVideo from '../../components/RtspVideo'

const SESSION_ID = 'WarTec'

const ARMOR_PIN = 'V31'

const ARMOR_KEY_CODE = "ControlLeft"
const ARMOR_2_KEY_CODE = "ShiftLeft"

let ARROW_LEFT = 'ArrowLeft'
let ARROW_RIGHT = 'ArrowRight'
const ARROW_UP = 'ArrowUp'
const ARROW_DOWN = 'ArrowDown'

const MOVE_STATES = {
  '0000': 0,
  '1100': 1,
  '0100': 2,
  '0110': 3,
  '0001': 4,
  '0011': 5,
  '0010': 6,
  '1001': 7,
  '1000': 8
}

const BUTTON_STATE_CHANGE = {
  [ARROW_UP]: [1, 1, -1, -1],
  [ARROW_LEFT]: [-1, 1, 1, -1],
  [ARROW_DOWN]: [-1, -1, 1, 1],
  [ARROW_RIGHT]: [1, -1, -1, 1]
}

const CONTROL_VIRTUAL_PIN = 'V30'

export async function getServerSideProps(context) {
  const BACKEND_URL = process.env.BACKEND
  const {
    TOKEN_KVESTGID,
    OPENVIDU_SERVER_URL,
    OPENVIDU_SERVER_SECRET
  } = process.env

  const {
    RTSP_STREAM,
    WEBRTC_SERVER,
    ROBOT_API_SERVER
  } = process.env

  let robot_game = null

  const {
    code,
    player_code,
    _robot
  } = context.query

  const response = await fetch(`${BACKEND_URL}/api/robot_game?token=${TOKEN_KVESTGID}&code=${code}&_robot=${_robot}&load_robot=1${player_code ? `&player_code=${player_code}` : ''}`)

  let robot = null
  if (response.status === 200) {
    const data = await response.json()
    robot_game = data[0] || null
  }
  if (_robot && robot_game) {
    const robot_config = robot_game.robots.find(robot_config => robot_config._robot._id === _robot)
    if (robot_config) {
      robot = robot_config._robot
    }
  }
  return {
    props: {
      robot_game: robot_game ? {
        name: robot_game.name,
        code: robot_game.code,
        state: robot_game.state,
        cameras: robot_game.cameras,
      } : null,
      robot,
      RTSP_STREAM,
      WEBRTC_SERVER,
      ROBOT_API_SERVER,
      OPENVIDU_SERVER_SECRET: robot_game.conference_is_enable ? OPENVIDU_SERVER_SECRET : null,
      OPENVIDU_SERVER_URL: robot_game.conference_is_enable ? OPENVIDU_SERVER_URL : null
    }
  }
}

class Home extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      token: props.robot ? props.robot.token : '',
      on: false,
      left: false,
      right: false,
      left_back: false,
      right_back: false,
      logs: [],
      keylogs: [],
      subscribers: [],
      myUserName: 'Робот ' + Math.floor(Math.random() * 100),
      alternative_control: false,
      state: [0, 0, 0, 0],
      timer: 0
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.handleChangeOn = this.handleChangeOn.bind(this);
    this.createSession = this.createSession.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);

    this.OPENVIDU_SERVER_SECRET = props.OPENVIDU_SERVER_SECRET;
    this.OPENVIDU_SERVER_URL = props.OPENVIDU_SERVER_URL;

    if (props.router.query.invert) {
      ARROW_LEFT = 'ArrowRight'
      ARROW_RIGHT = 'ArrowLeft'
    }

    this.myRef = React.createRef();
    setInterval(() => {
      this.setState({ timer: Date.now() })
    }, 50)
  }

  sessionId = SESSION_ID

  control_session_id = Math.round(Date.now() / 1000)
  step = 1
  move_state = [0, 0, 0, 0]

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    debugger
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.OpenVidu = require('openvidu-browser').OpenVidu

    require('webrtc-streamer/html/libs/adapter.min')
    // const WebRtcStreamer = require('../../components/webrtcstreamer.js')
    // this.webRtcServer = new WebRtcStreamer(this.myRef.current, this.props.WEBRTC_SERVER)
    // this.connect()
  }

  mainRtspStream = 0

  connect(index = 0) {
    this.mainRtspStream = index
  }

  buttons = {
    [ARROW_UP]: { state: false },
    [ARROW_LEFT]: { state: false },
    [ARROW_DOWN]: { state: false },
    [ARROW_RIGHT]: { state: false },
  }

  control(button, state, comment) {
    if (state && this.buttons[button].state) return
    if (!state && !this.buttons[button].state) return

    this.buttons[button].state = state

    const next_state = [
      ARROW_UP,
      ARROW_LEFT,
      ARROW_DOWN,
      ARROW_RIGHT
    ].reduce(
      (state, button) =>
        state.map((value, index) =>
          value + BUTTON_STATE_CHANGE[button][index] * (this.buttons[button].state ? 1 : -1)
        )
      , [0, 0, 0, 0]
    )

    const move_state = next_state.map(item => item > 0 ? 1 : 0).join('')
    console.log(`Отправляю запрос ${MOVE_STATES[move_state]} ${move_state}. Cтало ${next_state} ${comment}`)
    this.callApiBlink(CONTROL_VIRTUAL_PIN, MOVE_STATES[move_state])
  }

  onKeyDown(event) {
    if (!this.state.on) return
    event.preventDefault()
    this.log()
    if (event.repeat) {
      return
    }
    console.log(`Нажата ${event.code}`)
    switch (event.code) {
      case ARROW_UP:
        this.control(ARROW_UP, true);
        break;
      case ARROW_LEFT:
        this.control(ARROW_LEFT, true);
        break;
      case ARROW_DOWN:
        this.control(ARROW_DOWN, true);
        break;
      case ARROW_RIGHT:
        this.control(ARROW_RIGHT, true);
        break;
      case ARMOR_KEY_CODE:
        this.setState({ armor: true })
        this.callApiBlink(ARMOR_PIN, 1)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: true })
        this.callApiBlink(ARMOR_PIN, 2)
        break
      case 'Digit1':
        this.connect(0)
        break
      case 'Digit2':
        this.connect(1)
        break
      case 'Digit3':
        this.connect(2)
        break
      case 'Digit4':
        this.connect(3)
        break
      case 'Digit5':
        this.connect(4)
        break
      default:
        break
    }
    this.setState({
      keylogs: [
        ...this.state.keylogs,
        {
          time: new Date(),
          code: event.code,
          key: Math.random()
        }
      ].slice(-5)
    })
  }

  handleTokenChange(token) {
    this.setState({ token })
  }

  handleChangeOn(event) {
    this.setState({ on: event.target.checked })
  }

  handleChangeAlternateControl(event) {
    this.setState({ alternative_control: event.target.checked })
  }

  onKeyUp(event) {
    console.log(`Отжата ${event.code}`)
    if (!this.state.on) return;

    switch (event.code) {
      case ARROW_UP:
        this.control(ARROW_UP, false);
        break;
      case ARROW_LEFT:
        this.control(ARROW_LEFT, false);
        break;
      case ARROW_DOWN:
        this.control(ARROW_DOWN, false);
        break;
      case ARROW_RIGHT:
        this.control(ARROW_RIGHT, false);
        break;
      case ARMOR_KEY_CODE:
        this.setState({ armor: false })
        this.callApiBlink(ARMOR_PIN, 0)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: false })
        this.callApiBlink(ARMOR_PIN, 0)
        break
      default:
        break;
    }
  }

  log() {
    let time = Date.now()
    this.last_request = this.last_request || time
    let interval = this.last_request - time
    this.last_request = time

    console.log('Время с последнего запроса', interval)
  }

  callApiBlink(pin, value) {
    ++this.step

    let url = `${this.props.ROBOT_API_SERVER}/${this.state.token}/update/${pin}?value=${value}&value=${this.control_session_id}&value=${this.step}&value=${this.props.robot_game.code}`
    let time = Date.now()

    // this.log()

    fetch(url)
      .then(response => {
        const logs = [
          ...this.state.logs,
          {
            key: Math.random().toString(),
            status: response.status,
            time: new Date(),
            message: url,
            ping: Date.now() - time
          }
        ].slice(-5);
        this.setState({ logs })
      })
      .catch(err => { })
  }

  async getToken() {
    const sessionId = await this.createSession(this.state.mySessionId);
    return await this.createToken(sessionId);
  }

  joinSession(event) {
    event.preventDefault();
    this.OV = new this.OpenVidu();
    this.setState(
      {
        session: this.OV.initSession(),
      },
      () => {
        var mySession = this.state.session;

        mySession.on('streamCreated', (event) => {
          var subscriber = mySession.subscribe(event.stream, undefined);
          var subscribers = this.state.subscribers;
          subscribers.push(subscriber);

          this.setState({
            subscribers: subscribers,
          });
        });

        mySession.on('streamDestroyed', (event) => {
          this.deleteSubscriber(event.stream.streamManager);
        });

        this.getToken().then((token) => {
          mySession
            .connect(token, {
              clientData: this.props.robot.name
            })
            .then(() => {
              let publisher = this.OV.initPublisher(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: '640x480',
                frameRate: 30,
                insertMode: 'APPEND',
                mirror: false,
              });

              mySession.publish(publisher);

              this.setState({
                mainStreamManager: publisher,
                publisher: publisher,
              });
            })
            .catch((error) => {
              console.log('There was an error connecting to the session:', error.code, error.message);
            });
        });
      },
    );
  }

  leaveSession() {

    const mySession = this.state.session;

    if (mySession) {
      mySession.disconnect();
    }
    this.OV = null;
    this.setState({
      session: undefined,
      subscribers: [],
      mySessionId: 'SessionA',
      myUserName: 'Робот ' + Math.floor(Math.random() * 100),
      mainStreamManager: undefined,
      publisher: undefined
    });
  }

  async createSession() {
    let response = await fetch(this.OPENVIDU_SERVER_URL + '/api/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customSessionId: this.sessionId })
    })

    if (response.status === 200) {
      let data = await response.json();
      console.log('CREATE SESION', response);
      return data.id;
    } else if (response.status === 409) {
      console.log('SESSION ALREADY CREATED');
      return this.sessionId;
    }
  }

  async createToken(sessionId) {
    const response = await fetch(this.OPENVIDU_SERVER_URL + '/api/tokens', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + this.OPENVIDU_SERVER_SECRET),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session: sessionId })
    })

    if (response.status == 200) {
      const data = await response.json();
      console.log('TOKEN', data.token);
      return data.token;
    }
  }

  handleChangeUserName(event) {
    this.setState({ myUserName: event.target.value })
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  deleteSubscriber(streamManager) {
    let subscribers = this.state.subscribers;
    let index = subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      subscribers.splice(index, 1);
      this.setState({
        subscribers: subscribers,
      });
    }
  }

  handleMainVideoStream(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream
      });
    }
  }

  render() {
    const { robot_game } = this.props
    if (!robot_game || !this.props.robot) return <div>Кабина управления не доступна. Обратитесь к администратору.</div>
    if (robot_game.state === 'closed') return <div>Игра закончилась. Спасибо что были с нами!</div>
    if (robot_game.state === 'initialized') return <div>Игра скоро начнется. Ждем с нетерпением.</div>
    const timer = this.state.timer.toString().slice(-4)

    let cameras = robot_game.cameras

    if (this.mainRtspStream > 0) {
      cameras = [...cameras, ...cameras.slice(0, this.mainRtspStream)]
      cameras.splice(0, this.mainRtspStream)
      console.log(cameras)
    }

    return (<>
      <div className="container-fluid">
        <Head>
          <title>Кабина управления "{this.props.robot.name}"</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div style={{ height: "100vh", alignItems: "center", display: "flex" }}>
          <div className="row"  >
            <div className="col-9" style={{ padding: 0 }}>
              <RtstpVideo
                src={cameras[0].url}
                audio_src={cameras[0].audio_url}
                options={cameras[0].options}
                WEBRTC_SERVER={this.props.WEBRTC_SERVER}
                // width="1280"
                // height="720"
                controls />
            </div>
            <div className="col-3" style={{ padding: 0, alignItems: "top" }}>
              {
                cameras.slice(1).map((camera, index) =>
                  <RtstpVideo
                    key={index}
                    src={camera.url}
                    options={camera.options}
                    WEBRTC_SERVER={this.props.WEBRTC_SERVER}
                    // width="1280"
                    // height="720"
                    controls />
                )
              }
              <RtstpVideo
                    options="rtptransport=udp&timeout=60"
                    audio_src="rtsp://192.168.1.33:554/lives7"
                    WEBRTC_SERVER={this.props.WEBRTC_SERVER}
                    controls />
            </div>
          </div>
        </div>


        <div className="row">
          <div className="col-12 col-lg-8 p-0">
            {/* <video ref={this.myRef} controls autoPlay /> */}
            {/* <div className="row">
              {
                this.props.robot_game.cameras.map((camera, index) => {
                  return <div key={index} className="col-2">
                    <RtstpVideo src={camera.url} WEBRTC_SERVER={this.props.WEBRTC_SERVER} />
                  </div>
                })
              }
            </div> */}
            <div>{timer.slice(0, 1)} {timer.slice(-3)}</div>
            <h1>{this.props.robot.name}</h1>
            <div className="form-check">
              <input type="checkbox"
                className="form-check-input"
                checked={this.state.on}
                onChange={this.handleChangeOn} />
              <label className="form-check-label">Пуск</label>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            {!this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL && <div>
              <form onSubmit={this.joinSession}>
                <div className="form-group">
                  <button className="btn btn-success" id='buttonLeaveSession' name="commit" type="submit">
                    Подключиться к видеоконференции</button>
                </div>
              </form>
            </div>}
            {this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL &&
              <div id="session">
                <div id="video-container">
                  <div className="row">
                    {this.state.publisher !== undefined ? (
                      <div className="stream-container col-3 p-0"
                        onClick={() => this.handleMainVideoStream(this.state.publisher)}>
                        <UserVideoComponent streamManager={this.state.publisher} />
                      </div>
                    ) : null}
                    {this.state.subscribers.map((sub, i) => (
                      <div key={i} className="stream-container col-3 p-0" onClick={() => this.handleMainVideoStream(sub)}>
                        <UserVideoComponent streamManager={sub} />
                      </div>
                    ))}
                  </div>
                </div>
                <div id="session-header" className="col-12">
                  <button
                    className="btn btn-large btn-danger"
                    type="button"
                    id="buttonLeaveSession"
                    onClick={this.leaveSession}>Отключиться</button>
                </div>
                {/* {this.state.mainStreamManager !== undefined ? (
                  <div id="main-video" className="col-md-6 col-12">
                    <UserVideoComponent streamManager={this.state.mainStreamManager} />
                  </div>
                ) : null} */}

              </div>
            }
          </div>
          <div>
            <h3>Инструкция</h3>
            <ol>
              <li>Включить Пуск.</li>
              <li>Управление:
                <ul className="list-unstyled">
                  <li><kbd>&uarr;</kbd> - вперед</li>
                  <li><kbd>&darr;</kbd> - назад</li>
                  <li><kbd>&larr;</kbd> - влево </li>
                  <li><kbd>&rarr;</kbd> - вправо </li>
                  <li><kbd>Левый Shift</kbd> - Cнаряжение</li>
                  <li><kbd>Левый Control</kbd> - Сняряжение 2</li>
                  <li><kbd>1</kbd>, <kbd>2</kbd> - переключение между камерами</li>
                </ul>
              </li>

            </ol>
          </div>
          {this.state.logs.length > 0 && <table className="log">
            <thead>
              <tr>
                <th>
                  Time
                </th>
                <th>
                  HTTP code
                </th>
                <th>
                  Команда
                </th>
                <th>
                  Пинг
                </th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.logs.map(log => {
                  return <tr key={log.key}>
                    <td>
                      {log.time.toString()}
                    </td>
                    <td>
                      {log.status}
                    </td>
                    <td>
                      {log.message}
                    </td>
                    <td>
                      {log.ping} мс
                  </td>
                  </tr>
                })
              }
            </tbody>
          </table>}
          {this.state.keylogs.length > 0 && <table className="log">
            <thead>
              <tr>
                <th>Time</th>
                <th>Key code</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.keylogs.map(log =>
                  <tr key={log.key}>
                    <td>{log.time.toString()}</td>
                    <td>{log.code}</td>
                  </tr>
                )
              }
            </tbody>
          </table>}
        </div>
        <style jsx>{`
          h1 {
            font-size: 2rem;
          }
          .container {
            min-height: 100vh;
            padding: 0 0.5rem;
          }
          video {
            width: 100%;
          }
          #video-container,
          .video-container {
            width: 100%;
          }

          #buttonLeaveSession {
            position: fixed;
            bottom: 10px;
            right: 10px;
          }

          table.log {
            font-size: 8px;
            color: gray;
          }

          table tr.active {
            color: red;
            font-weight: bold;
          }
          main {
            padding: 5rem 0;
            flex: 1;
            // display: flex;
            // flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          footer {
            width: 100%;
            height: 100px;
            border-top: 1px solid #eaeaea;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          footer img {
            margin-left: 0.5rem;
          }

          footer a {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          a {
            color: inherit;
            text-decoration: none;
          }

          .title a {
            color: #0070f3;
            text-decoration: none;
          }

          .title a:hover,
          .title a:focus,
          .title a:active {
            text-decoration: underline;
          }

          .title {
            margin: 0;
            line-height: 1.15;
            font-size: 4rem;
          }

          .title,
          .description {
            text-align: center;
          }

          .description {
            line-height: 1.5;
            font-size: 1.5rem;
          }

          code {
            background: #fafafa;
            border-radius: 5px;
            padding: 0.75rem;
            font-size: 1.1rem;
            font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
              DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
          }

          .grid {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;

            max-width: 800px;
            margin-top: 3rem;
          }

          .card {
            margin: 1rem;
            flex-basis: 45%;
            padding: 1.5rem;
            text-align: left;
            color: inherit;
            text-decoration: none;
            border: 1px solid #eaeaea;
            border-radius: 10px;
            transition: color 0.15s ease, border-color 0.15s ease;
          }

          .card:hover,
          .card:focus,
          .card:active {
            color: #0070f3;
            border-color: #0070f3;
          }

          .card h3 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          .card p {
            margin: 0;
            font-size: 1.25rem;
            line-height: 1.5;
          }

          .logo {
            height: 1em;
          }

          @media (max-width: 600px) {
            .grid {
              width: 100%;
              flex-direction: column;
            }
          }
        `}</style>

        <style jsx global>{`
          html,
          body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
              Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
              sans-serif;
            background-color: black;
            color: white;  
          }

          * {
            box-sizing: border-box;
          }
        `}</style>
      </div>
    </>
    )
  }

}

export default withRouter(Home)
import Head from 'next/head'
import { useRouter, withRouter } from 'next/router'
import UserVideoComponent from '../../components/UserVideoComponent'

import fetch from 'node-fetch'

const SESSION_ID = 'WarTec'

const LEFT_PIN = 'D4'
const RIGHT_PIN = 'D16'

const LEFT_BACK_PIN = 'D14'
const RIGHT_BACK_PIN = 'D5'

const ARMOR_PIN = 'D12'
const ARMOR_2_PIN = 'D13'
const ACCELERATE_PIN = 'D0'

const LEFT_FORWARD_KEY_CODE = "KeyW"
const RIGHT_FORWARD_KEY_CODE = "KeyP"

const LEFT_BACK_KEY_CODE = "KeyS"
const RIGHT_BACK_KEY_CODE = "KeyL"
const ACCELERATE_KEY_CODE = "Space"
const ARMOR_KEY_CODE = "Enter"
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

const CONTROL_VIRTUAL_PIN = 'V30'

export async function getServerSideProps(context) {
  const BACKEND_URL = process.env.BACKEND
  const { TOKEN_KVESTGID } = process.env

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

  if (response.status === 200) {
    const data = await response.json()
    robot_game = data[0] || null
  }

  return {
    props: {
      robot_game,
      RTSP_STREAM,
      WEBRTC_SERVER,
      ROBOT_API_SERVER
    }
  }
}

class Home extends React.Component {
  constructor(props) {
    super(props)
    const { _robot } = props.router.query
    let token = null
    if (_robot && props.robot_game) {
      const robot_config = props.robot_game.robots.find(robot_config => robot_config._robot._id === _robot)
      if (robot_config) {
        token = robot_config._robot.token
        this.robot = robot_config._robot
      }
    }

    this.state = {
      token,
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
      state: [0, 0, 0, 0]
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.handleChangeOn = this.handleChangeOn.bind(this);

    this.OPENVIDU_SERVER_SECRET = props.router.query.OPENVIDU_SERVER_SECRET;
    this.OPENVIDU_SERVER_URL = props.router.query.OPENVIDU_SERVER_URL;
    this.IP_CAMERA_RTSP_URL = props.router.query.IP_CAMERA_RTSP_URL;

    this.createSession = this.createSession.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);

    if (props.router.query.invert) {
      ARROW_LEFT = 'ArrowRight'
      ARROW_RIGHT = 'ArrowLeft'
    }

    this.myRef = React.createRef();
  }

  sessionId = SESSION_ID

  control_session_id = Math.round(Date.now() / 1000)
  step = 0

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    this.webRtcServer.disconnect()
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.OpenVidu = require('openvidu-browser').OpenVidu;

    require('webrtc-streamer/html/libs/adapter.min');
    const WebRtcStreamer = require('../../components/webrtcstreamer.js');
    this.webRtcServer = new WebRtcStreamer(this.myRef.current, this.props.WEBRTC_SERVER);
    this.webRtcServer.connect(this.props.RTSP_STREAM, null, 'rtptransport=tcp&timeout=60');
  }

  control(state) {
    const prev_state = this.state.state;
    this.setState({
      state: prev_state.map((value, index) => state[index] + value)
    }, () => {
      const move_state = this.state.state.map(item => item > 0 ? 1 : 0).join('');
      this.callApiBlink(CONTROL_VIRTUAL_PIN, MOVE_STATES[move_state]);
    });
  }

  onKeyDown(event) {
    if (!this.state.on) return
    event.preventDefault()
    if (event.repeat) return
    switch (event.code) {
      case ARROW_UP:
        this.control([1, 1, -1, -1]);
        break;
      case ARROW_LEFT:
        this.control([-1, 1, 1, -1]);
        break;
      case ARROW_DOWN:
        this.control([-1, -1, 1, 1]);
        break;
      case ARROW_RIGHT:
        this.control([1, -1, -1, 1]);
        break;
      case LEFT_FORWARD_KEY_CODE:
        this.setState({ left: true })
        this.callApiBlink(LEFT_PIN, 1)
        break
      case RIGHT_FORWARD_KEY_CODE:
        this.setState({ right: true })
        this.callApiBlink(RIGHT_PIN, 1)
        break
      case LEFT_BACK_KEY_CODE:
        this.setState({ left_back: true })
        this.callApiBlink(LEFT_BACK_PIN, 1)
        break
      case RIGHT_BACK_KEY_CODE:
        this.setState({ right_back: true })
        this.callApiBlink(RIGHT_BACK_PIN, 1)
        break
      case ACCELERATE_KEY_CODE:
        this.setState({ accelerate: true })
        this.callApiBlink(ACCELERATE_PIN, 1)
        break
      case ARMOR_KEY_CODE:
        this.setState({ armor: true })
        this.callApiBlink(ARMOR_PIN, 1)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: true })
        this.callApiBlink(ARMOR_2_PIN, 1)
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
    if (!this.state.on) return;

    switch (event.code) {
      case ARROW_UP:
        this.control([-1, -1, 1, 1]);
        break;
      case ARROW_LEFT:
        this.control([1, -1, -1, 1]);
        break;
      case ARROW_DOWN:
        this.control([1, 1, -1, -1]);
        break;
      case ARROW_RIGHT:
        this.control([-1, 1, 1, -1]);
        break;
      case LEFT_FORWARD_KEY_CODE:
        this.setState({ left: false })
        this.callApiBlink(LEFT_PIN, 0)
        break;
      case RIGHT_FORWARD_KEY_CODE:
        this.setState({ right: false })
        this.callApiBlink(RIGHT_PIN, 0)
        break;
      case LEFT_BACK_KEY_CODE:
        this.setState({ left_back: false })
        this.callApiBlink(LEFT_BACK_PIN, 0)
        break
      case RIGHT_BACK_KEY_CODE:
        this.setState({ right_back: false })
        this.callApiBlink(RIGHT_BACK_PIN, 0)
        break
      case ACCELERATE_KEY_CODE:
        this.setState({ accelerate: false })
        this.callApiBlink(ACCELERATE_PIN, 0)
        break
      case ARMOR_KEY_CODE:
        this.setState({ armor: false })
        this.callApiBlink(ARMOR_PIN, 0)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: false })
        this.callApiBlink(ARMOR_2_PIN, 0)
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

    console.log('Time last request', interval)
  }

  callApiBlink(pin, value) {
    ++this.step

    let url = `${this.props.ROBOT_API_SERVER}/${this.state.token}/update/${pin}?value=${value}&value=${this.control_session_id}&value=${this.step}`
    let time = Date.now()

    this.log()

    fetch(url)
      .then(response => {
        console.log(response.status)
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
              clientData: this.state.myUserName
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

    if (!robot_game || !this.robot) return <div>Кабина управления не доступна. Обратитесь к администратору.</div>
    if (robot_game.state === 'closed') return <div>Игра закончилась. Спасибо что были с нами!</div>
    if (robot_game.state === 'initialized') return <div>Игра скоро начнется. Ждем с нетерпением.</div>

    return (<>
      <div className="container-fluid">
        <Head>
          <title>Кабина управления "{ this.robot.name }"</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="row">
          <div className="col-12 col-lg-6 p-0">
            <video ref={this.myRef} controls autoPlay />
          </div>
          <div className="col-12 col-lg-6 pt-5">
            <h1>{this.robot.name}</h1>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" checked={this.state.on} onChange={this.handleChangeOn} />
              <label className="form-check-label">Пуск</label>
            </div>
            <h3>Инструкция</h3>
            <ol>
              <li>Включить Пуск.</li>
              <li>Управление:
                <ul className="list-unstyled">
                  <li><kbd>&uarr;</kbd> - вперед</li>
                  <li><kbd>&darr;</kbd> - назад</li>
                  <li><kbd>&larr;</kbd> - влево </li>
                  <li><kbd>&rarr;</kbd> - вправо </li>
                  <li><kbd>Левый Shift</kbd> - Доспехи</li>
                  <li><kbd>Enter</kbd> - Доспехи 2</li>
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
          .container {
            min-height: 100vh;
            padding: 0 0.5rem;
          }
          video {
            width: 100%;
          }
          #video-container,
          .video-container {
            max-width: 640px;
            width: 100%;
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
      <div className="container">
        {!this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL && <div>
          <h3>Конференция</h3>
          <form onSubmit={this.joinSession}>
            <div className="form-group">
              <label>Участник: </label>
              <input
                className="form-control"
                type="text"
                id="userName"
                value={this.state.myUserName}
                onChange={this.handleChangeUserName}
                required
              />
              <small className="form-text text-muted">Сервер для коференции включается по запросу.</small>
            </div>
            <div className="form-group">
              <button className="btn btn-lg btn-success" name="commit" type="submit" >
                Подключиться
                </button>
            </div>
          </form>
        </div>}
        {this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL &&
          <div id="session" className="row" >
            <div id="session-header" className="col-12">
              <h2 id="session-title">Комната: {this.sessionId}</h2>
              <div className="form-group">
                <button
                  className="btn btn-large btn-danger"
                  type="button"
                  id="buttonLeaveSession"
                  onClick={this.leaveSession}
                >
                  Отключиться
                  </button>
              </div>
            </div>
            {this.state.mainStreamManager !== undefined ? (
              <div id="main-video" className="col-md-6 col-12">
                <UserVideoComponent streamManager={this.state.mainStreamManager} />
              </div>
            ) : null}
            <div id="video-container" className="col-md-6 col-12">
              <label>Участники: {this.state.subscribers.length + 1}</label>
              <div className="row">
                {this.state.publisher !== undefined ? (
                  <div className="stream-container col-md-6 col-xs-6 col-12"
                    onClick={() => this.handleMainVideoStream(this.state.publisher)}>
                    <UserVideoComponent streamManager={this.state.publisher} />
                  </div>
                ) : null}
                {this.state.subscribers.map((sub, i) => (
                  <div key={i} className="stream-container col-md-6 col-xs-6" onClick={() => this.handleMainVideoStream(sub)}>
                    <UserVideoComponent streamManager={sub} />
                  </div>
                ))}
              </div>

            </div>
          </div>
        }
      </div>
    </>
    )
  }

}

export default withRouter(Home)
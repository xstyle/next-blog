import Head from 'next/head'
import { useRouter, withRouter } from 'next/router'
import UserVideoComponent from '../components/UserVideoComponent'

let LEFT_PIN = 'D4'
let RIGHT_PIN = 'D16'

let LEFT_BACK_PIN = 'D14'
let RIGHT_BACK_PIN = 'D5'

let ARMOR_PIN = 'D12'
let ARMOR_2_PIN = 'D13'
let ACCELERATE_PIN = 'D0'


let LEFT_FORWARD_KEY_CODE = "KeyW"
let RIGHT_FORWARD_KEY_CODE = "KeyP"

let LEFT_BACK_KEY_CODE = "KeyS"
let RIGHT_BACK_KEY_CODE = "KeyL"
let ACCELERATE_KEY_CODE = "Space"
let ARMOR_KEY_CODE = "Enter"
let ARMOR_2_KEY_CODE = "ShiftLeft"

class MyForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOn: true,
    };
    this.handleChangeOn = this.handleChangeOn.bind(this);
  }

  handleChangeOn(event) {
    this.props.handleChangeOn(event.target.checked);
  }
  render() {
    return (
      <form>
        <label>
          Пуск:
        <input type="checkbox" checked={this.props.on} onChange={this.handleChangeOn} />
        </label>
        <style jsx>{`
        form {
          padding-bottom: 1rem;
        }
        `}</style>
      </form>
    )
  }
}



class Home extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      token: props.router.query.token,
      on: false,
      left: false,
      right: false,
      left_back: false,
      right_back: false,
      logs: [],
      keylogs: [],
      subscribers: [],
      myUserName: 'Робот ' + Math.floor(Math.random() * 100),
    }
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.handleChangeOn = this.handleChangeOn.bind(this);

    this.OPENVIDU_SERVER_SECRET = props.router.query.OPENVIDU_SERVER_SECRET;
    this.OPENVIDU_SERVER_URL = props.router.query.OPENVIDU_SERVER_URL;

    this.createSession = this.createSession.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);
  }

  sessionId = "WarTec"

  static getInitialProps({ query }) {
    return { query }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload);
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.OpenVidu = require('openvidu-browser').OpenVidu
  }

  onKeyDown(event) {
    if (event.repeat) return
    if (!this.state.on) return

    switch (event.code) {
      case LEFT_FORWARD_KEY_CODE:
        this.setState({ left: true })
        this.callApiBlink(LEFT_PIN, true)
        break
      case RIGHT_FORWARD_KEY_CODE:
        this.setState({ right: true })
        this.callApiBlink(RIGHT_PIN, true)
        break
      case LEFT_BACK_KEY_CODE:
        this.setState({ left_back: true })
        this.callApiBlink(LEFT_BACK_PIN, true)
        break
      case RIGHT_BACK_KEY_CODE:
        this.setState({ right_back: true })
        this.callApiBlink(RIGHT_BACK_PIN, true)
        break
      case ACCELERATE_KEY_CODE:
        this.setState({ accelerate: true })
        this.callApiBlink(ACCELERATE_PIN, true)
        break
      case ARMOR_KEY_CODE:
        this.setState({ armor: true })
        this.callApiBlink(ARMOR_PIN, true)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: true })
        this.callApiBlink(ARMOR_2_PIN, true)
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
          key: Date.now()
        }
      ].slice(-5)
    })
  }
  handleTokenChange(token) {
    this.setState({ token })
  }
  handleChangeOn(on) {
    this.setState({ on })
  }
  onKeyUp(event) {
    if (!this.state.on) return;
    switch (event.code) {
      case LEFT_FORWARD_KEY_CODE:
        this.setState({ left: false })
        this.callApiBlink(LEFT_PIN, false)
        break;
      case RIGHT_FORWARD_KEY_CODE:
        this.setState({ right: false })
        this.callApiBlink(RIGHT_PIN, false)
        break;
      case LEFT_BACK_KEY_CODE:
        this.setState({ left_back: false })
        this.callApiBlink(LEFT_BACK_PIN, false)
        break
      case RIGHT_BACK_KEY_CODE:
        this.setState({ right_back: false })
        this.callApiBlink(RIGHT_BACK_PIN, false)
        break
      case ACCELERATE_KEY_CODE:
        this.setState({ accelerate: false })
        this.callApiBlink(ACCELERATE_PIN, false)
        break
      case ARMOR_KEY_CODE:
        this.setState({ armor: false })
        this.callApiBlink(ARMOR_PIN, false)
        break
      case ARMOR_2_KEY_CODE:
        this.setState({ armor_2: false })
        this.callApiBlink(ARMOR_2_PIN, false)
        break
      default:
        break;
    }
  }
  callApiBlink(pin, value) {
    let url = `https://wartec.ddns.net/${this.state.token}/update/${pin}?value=${value ? 1 : 0}`
    let time = Date.now()

    fetch(url)
      .then(response => {
        console.log(response.status)
        this.setState({
          logs: [
            ...this.state.logs,
            {
              key: time,
              status: response.status,
              time: new Date(),
              message: url,
              ping: Date.now() - time
            }
          ].slice(-5)
        })
      })
      .catch(err => {
        console.log('errr', err);
      })
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
    return (
      <div className="container">
        <Head>
          <title>Create Next App</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div>
          <MyForm onChange={this.handleTokenChange} handleChangeOn={this.handleChangeOn} on={this.state.on} token={this.state.token} />
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

          <h3>Инструкция</h3>
          <ol>
            <li>Включить Пуск.</li>
            <li>Управлять кнопками <b>W</b> - вперед влево, <b>S</b> - назад влево, <b>P</b> - вперед вправо, <b>L</b> - назад вправо, <b>Пробел</b> - ускорение, <b>Левый Shift</b> - Доспехи, <b>Enter</b> - Доспехи 2.</li>
            <li>В логах видно время запроса, код ответа сервера, команда и время выполнения запроса.</li>
          </ol>
          <h3>Настройки</h3>
          <table>
            <thead>
              <tr>
                <th>Команда</th>
                <th>Key code</th>
                <th>Pin</th>
              </tr>
            </thead>
            <tbody>
              <tr className={this.state.left ? "active" : ""}>
                <td>Влево вперед</td>
                <td>{LEFT_FORWARD_KEY_CODE}</td>
                <td>{LEFT_PIN}</td>
              </tr>
              <tr className={this.state.right ? "active" : ""}>
                <td>Вправо вперед</td>
                <td>{RIGHT_FORWARD_KEY_CODE}</td>
                <td>{RIGHT_PIN}</td>
              </tr>
              <tr className={this.state.left_back ? "active" : ""}>
                <td>Влево назад</td>
                <td>{LEFT_BACK_KEY_CODE}</td>
                <td>{LEFT_BACK_PIN}</td>
              </tr>
              <tr className={this.state.right_back ? "active" : ""}>
                <td>Вправо назад</td>
                <td>{RIGHT_BACK_KEY_CODE}</td>
                <td>{RIGHT_BACK_PIN}</td>
              </tr>
              <tr className={this.state.accelerate ? "active" : ""}>
                <td>Ускорение</td>
                <td>{ACCELERATE_KEY_CODE}</td>
                <td>{ACCELERATE_PIN}</td>
              </tr>
              <tr className={this.state.armor ? "active" : ""}>
                <td>Доспехи</td>
                <td>{ARMOR_KEY_CODE}</td>
                <td>{ARMOR_PIN}</td>
              </tr>
              <tr className={this.state.armor_2 ? "active" : ""}>
                <td>Доспехи 2</td>
                <td>{ARMOR_2_KEY_CODE}</td>
                <td>{ARMOR_2_PIN}</td>
              </tr>
            </tbody>

          </table>
        </div>

        {!this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL && <div>
          <h1>Подключиться к конференции</h1>
          <form className="form-group" onSubmit={this.joinSession}>
            <div>
              <label>Участник: </label>
              <input
                className="form-control"
                type="text"
                id="userName"
                value={this.state.myUserName}
                onChange={this.handleChangeUserName}
                required
              />
            </div>
            <div className="form-group">
              <button className="btn btn-lg btn-success" name="commit" type="submit" >
                Подключиться
                </button>
            </div>
          </form>
        </div>}
        {this.state.session && this.OPENVIDU_SERVER_SECRET && this.OPENVIDU_SERVER_URL &&
          <div id="session">
            <div id="session-header">
              <h1 id="session-title">{this.sessionId}</h1>
              <button
                className="btn btn-large btn-danger"
                type="button"
                id="buttonLeaveSession"
                onClick={this.leaveSession}
              >
                Отключиться
              </button>
            </div>

            {this.state.mainStreamManager !== undefined ? (
              <div id="main-video" className="col-md-6">
                <UserVideoComponent streamManager={this.state.mainStreamManager} />
              </div>
            ) : null}
            <div id="video-container" className="col-md-6">
              {this.state.publisher !== undefined ? (
                <div className="stream-container col-md-6 col-xs-6" onClick={() => this.handleMainVideoStream(this.state.publisher)}>
                  <UserVideoComponent
                    streamManager={this.state.publisher} />
                </div>
              ) : null}
              {this.state.subscribers.map((sub, i) => (
                <div key={i} className="stream-container col-md-6 col-xs-6" onClick={() => this.handleMainVideoStream(sub)}>
                  <UserVideoComponent streamManager={sub} />
                </div>
              ))}
            </div>
          </div>
        }
        <div className="video-container">
          <iframe id='fp_embed_player'
            src='https://demo.flashphoner.com:8888/embed_player?urlServer=wss://demo.flashphoner.com:8443&streamName=rtsp://178.141.81.193:551/user=admin_password=on1vqgKU_channel=1_stream=0.sdp?real_stream&mediaProviders=WebRTC'
            marginWidth='0'
            marginHeight='0'
            frameBorder='0'
            width='100%'
            height='400px'
            scrolling='no'
            allowFullScreen='allowfullscreen'
          />
        </div>

        <style jsx>{`
          .container {
            min-height: 100vh;
            padding: 0 0.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          #video-container,
          .video-container {
            width: 640px;
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
            display: flex;
            flex-direction: column;
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
          }

          * {
            box-sizing: border-box;
          }
        `}</style>
      </div>
    )
  }

}
export default withRouter(Home)

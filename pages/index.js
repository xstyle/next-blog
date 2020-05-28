import Head from 'next/head'
import { useRouter, withRouter } from 'next/router'

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
      token: props.token,
      showOn: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChangeOn = this.handleChangeOn.bind(this);
  }
  handleChange(event) {
    this.setState({ token: event.target.value });
  }
  handleSubmit(event) {
    event.stopPropagation();
    if (!this.state.token) return;
    this.props.onChange(this.state.token);
    this.setState({ showOn: true });
  }
  handleChangeOn(event) {
    this.props.handleChangeOn(event.target.checked);
  }
  render() {
    return (
      <form>
        <label>
          Token<sup>*</sup>:
          {!this.state.showOn && <input type="text" value={this.state.token} onChange={this.handleChange} />}
          {this.state.showOn && this.props.token}
        </label>
        {!this.state.showOn && <button onClick={this.handleSubmit} type="button">Ключ на старт!</button>}

        <br />
        {this.state.showOn &&
          <label>
            Пуск:
        <input type="checkbox" checked={this.props.on} onChange={this.handleChangeOn} />
          </label>
        }

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
      keylogs: []
    }
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.handleChangeOn = this.handleChangeOn.bind(this);
  }
  static getInitialProps({ query }) {
    return { query }
  }
  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
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
    let url = `https://blynk-cloud.com/${this.state.token}/update/${pin}?value=${value ? 1 : 0}`
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
          </table>}
          {this.state.keylogs.length > 0 && <table className="log">
            <thead>
              <tr>
                <th>Time</th>
                <th>Key code</th>
              </tr>
            </thead>
            {
              this.state.keylogs.map(log =>
                <tr key={log.key}>
                  <td>{log.time.toString()}</td>
                  <td>{log.code}</td>
                </tr>
              )
            }
          </table>}

          <h3>Инструкция</h3>
          <ol>
            <li>Вставить Access Token от Blynk. Нажать <b>Ключ на старт!</b></li>
            <li>Включить Пуск. В выключенном состоянии команды не отправляются на сервер Blynk.</li>
            <li>Стрелками Влево (D2) - Вправо (D0) управлять. </li>
            <li>В логах видно время запроса, код ответа сервера, команда и время выполнения запроса.</li>
          </ol>
          <p><sup>*</sup> Токены и активность никак не сохраняется. Для сброса достаточно обновить страницу в браузере.</p>
          <h3>Настройки</h3>
          <table>
            <thead>
              <th>Команда</th>
              <th>Key code</th>
              <th>Pin</th>
            </thead>
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
          </table>
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
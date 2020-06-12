import Head from 'next/head'

const ARROW_UP = 'ArrowUp'
const ARROW_DOWN = 'ArrowDown'
const ARROW_LEFT = 'ArrowLeft'
const ARROW_RIGHT = 'ArrowRight'
const SHIFT_LEFT = 'ShiftLeft'

const SPEED = 2
const ROBOT_SIZE = 100
const TARGET_SIZE = 50

export default class Demo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            top: 500,
            left: 500,
            rotate: 0,
            arrow_left: false,
            arrow_right: false,
            arrow_up: false,
            arrow_down: false,
            timer: 0
        }
        this.step = this.step.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleCaugh = this.handleCaugh.bind(this)
    }
    start = Date.now();
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        this.timer = setInterval(this.step, 1000 / 60)
        console.log(this.container.offsetWidth, this.container.offsetHeight)
        this.setState({
            top: this.container.offsetHeight / 2,
            left: this.container.offsetWidth / 2
        })
    }

    step() {
        const state = {
            left: this.state.left,
            top: this.state.top,
            rotate: this.state.rotate,
            timer: Date.now() - this.start
        }
        if (this.state.arrow_up) {
            state.top = this.beetween(state.top - Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, ROBOT_SIZE / 2, this.container.offsetHeight - ROBOT_SIZE / 2)
            state.left = this.beetween(state.left - Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, ROBOT_SIZE / 2, this.container.offsetWidth - ROBOT_SIZE / 2)
        }
        if (this.state.arrow_down) {
            state.top = this.beetween(state.top + Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, ROBOT_SIZE / 2, this.container.offsetHeight - ROBOT_SIZE / 2)
            state.left = this.beetween(state.left + Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, ROBOT_SIZE / 2, this.container.offsetWidth - ROBOT_SIZE / 2)
        }
        if (this.state.arrow_left) {
            state.rotate = (state.rotate - SPEED * (this.state.arrow_down ? -1 : 1)) % 360
        }
        if (this.state.arrow_right) {
            state.rotate = (state.rotate + SPEED * (this.state.arrow_down ? -1 : 1)) % 360
        }
        this.setState(state)
    }

    beetween(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.code) {
            case ARROW_UP:
                this.setState({ arrow_up: true })
                break
            case ARROW_DOWN:
                this.setState({ arrow_down: true })
                break
            case ARROW_LEFT:
                this.setState({ arrow_left: true })
                break
            case ARROW_RIGHT:
                this.setState({ arrow_right: true })
                break
            case SHIFT_LEFT:
                this.setState({ shift_left: !this.state.shift_left })
                break
            default:
                break
        }
    }
    handleKeyUp(event) {
        switch (event.code) {
            case ARROW_UP:
                this.setState({ arrow_up: false })
                break
            case ARROW_DOWN:
                this.setState({ arrow_down: false })
                break
            case ARROW_LEFT:
                this.setState({ arrow_left: false })
                break
            case ARROW_RIGHT:
                this.setState({ arrow_right: false })
                break
            // case SHIFT_LEFT:
            //     this.setState({ shift_left: false })
            //     break
            default:
                break
        }
    }
    handleCaugh() {
        clearInterval(this.timer)
    }
    render() {
        const left = this.state.left - ROBOT_SIZE / 2
        const top = this.state.top - ROBOT_SIZE / 2

        return <>
            <div id="container"
                ref={el => this.container = el}>
                <div className="timer">Таймер: {Math.round(this.state.timer / 1000)} c</div>
                <Help />
                <Target
                    container={this.container}
                    top={this.state.top}
                    left={this.state.left}
                    onCaught={this.handleCaugh}
                />
                <div
                    className="robot"
                    style={{
                        top,
                        left,
                        transform: `rotate(${this.state.rotate}deg)`
                    }}>
                    <div className="robot-body" style={{
                        boxShadow: `${Math.cos(((this.state.rotate - 45) / 180) * Math.PI) * 10}px ${-Math.sin(((this.state.rotate - 45) / 180) * Math.PI) * 10}px 20px -4px black`
                    }}></div>
                    {/* <div>top: {Math.round(this.state.top)}</div>
                    <div>left: {Math.round(this.state.left)}</div> */}
                    {/* <div>{this.state.rotate}˚</div> */}
                    <div className="front-wheel wheel"></div>
                    <div className="rear-wheel wheel"></div>
                    <div className={"circular-saw" + (this.state.shift_left ? " rotate" : "")}>+</div>
                </div>
            </div>
            <style jsx>{`
                .robot {
                    position: absolute;
                    display: inline-block;
                    height: ${ROBOT_SIZE}px;
                    width: ${ROBOT_SIZE}px;
                    color: white;
                    text-align: center;
                    padding: 0 10px;
                }
                .robot-body {
                    background-color: green;
                    width: 100%;
                    height: 100%;
                    z-index: 2;
                    border-radius: 10px;
                    position: relative;
                }
                #container {
                    height: 100%;
                    width: 100%;
                    position: fixed;
                }
                .wheel {
                    position: absolute;
                    width: 100%;
                    height: 30px;
                    z-index: 1;
                    background-color: black;
                }
                .front-wheel {
                    top: 10px;
                    left: 0;
                }
                .rear-wheel {
                    bottom: 10px;
                    left: 0;
                }
                .circular-saw {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    top: -15px;
                    left: calc(50% - 20px);
                    border-radius: 50%;
                    background-color: red;
                    z-index: 10;
                    border: 3px dotted black;
                    text-align: center;
                    padding: 4px;
                }
                .rotate {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
                .timer {
                    color: rgba(255,255,255,0.5);
                    padding: 10px;
                }
            `}</style>
            <style jsx global>{`
                body {
                    background-color: gray;
                }
            `}</style>
        </>
    }
}

class Target extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            top: 0,
            left: 0,
            direction: 0
        }
        this.step = this.step.bind(this)
        this.changeDirection = this.changeDirection.bind(this);
    }
    componentDidMount() {
        this.timer = setInterval(this.step, 1000 / 60)
        //setInterval(this.changeDirection, 5000)
    }
    setCaught() {
        clearInterval(this.timer)
        this.setState({ is_caught: true })
        this.props.onCaught()
        console.log(this.state.top, this.state.left, this.props.top, this.props.left)
    }
    step() {
        const diff_top = this.props.top - this.state.top
        const diff_left = this.props.left - this.state.left
        const distance = Math.sqrt(Math.pow(diff_top, 2) + Math.pow(diff_left, 2))
        const distance_ratio = distance / this.props.container.offsetWidth

        if (distance < (ROBOT_SIZE + TARGET_SIZE) / 2) {
            this.setCaught()
            return;
        }

        let speed = SPEED * (1 - distance / this.props.container.offsetWidth) * 2
        speed = speed > 0.1 ? speed : 0
        this.setState({
            left: this.beetween(this.state.left + Math.sin((this.state.direction + 90) * Math.PI / 180) * speed, TARGET_SIZE / 2, this.props.container.offsetWidth - TARGET_SIZE / 2),
            top: this.beetween(this.state.top + Math.cos((this.state.direction + 90) * Math.PI / 180) * speed, TARGET_SIZE / 2, this.props.container.offsetHeight - TARGET_SIZE / 2),
            distance,
            distance_ratio
        }, () => {
            let wall;
            if (this.state.top === TARGET_SIZE / 2) {
                wall = 'top'
            } else if (this.state.top === this.props.container.offsetHeight - TARGET_SIZE / 2) {
                wall = 'bottom'
            } else if (this.state.left === TARGET_SIZE / 2) {
                wall = 'left'
            } else if (this.state.left === this.props.container.offsetWidth - TARGET_SIZE / 2) {
                wall = 'right'
            }
            wall && this.changeDirection(wall)
        })
    }

    beetween(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }

    changeDirection(wall) {
        const diff_top = this.props.top - this.state.top;
        const diff_left = this.props.left - this.state.left;
        const c = Math.sqrt(Math.pow(diff_top, 2) + Math.pow(diff_left, 2))
        const cosLeft = diff_left / c;
        const angleRadian = Math.acos(cosLeft)
        const angle = (angleRadian / Math.PI * 180 * (diff_top < 0 ? 1 : -1)) + 360 * (diff_top < 0 ? 0 : 1)
        console.log(`angle ${angle}`)

        const zone = 90 * Math.max(1 - c / this.props.container.offsetHeight, 0.5)

        let new_direction = Math.random() * (360 - zone - 180);

        if (wall === 'top') {
            new_direction += 180
        } else if (wall === 'left' && new_direction > 90) {
            new_direction += 180
        } else if (wall === 'bottom' && new_direction > 180) { // imposible
            new_direction += 180;
        } else if (wall === 'right' && new_direction < 90) {
            new_direction += 90;
        }

        if (new_direction >= (angle - zone / 2)) {
            new_direction += zone;
        }

        this.setState({ direction: new_direction })
    }

    render() {
        const top = this.state.top - TARGET_SIZE / 2
        const left = this.state.left - TARGET_SIZE / 2
        return <>
            <div className={"target" + (this.state.is_caught ? " caught" : "")}
                style={{
                    top,
                    left,
                }}>
                {/* <div>top: {Math.round(this.state.top)}</div>
                <div>left: {Math.round(this.state.left)}</div> */}
                {/* <div>{Math.round(this.state.distance_ratio * 100) / 100}</div> */}
            </div>
            <style jsx>{`
                .target {
                    position: absolute;
                    width: ${TARGET_SIZE}px;
                    height: ${TARGET_SIZE}px;
                    background-color: rgb(255,${Math.round(this.state.distance_ratio * 255)},0);
                    border-radius: 50%;
                    text-align: center;
                    font-size: 9px;
                    padding: 5px;
                }
                .caught {
                    background-color: green;
                }
            `}</style>
        </>
    }
}

function Help() {
    return <>
        <div className="help">
            Это тренажер для обучения управлением робота.
            Движением робота можно управлять с помощью клавиш <kbd>вверх</kbd> <kbd>вниз</kbd> <kbd>влево</kbd> <kbd>вправо</kbd>.
            Для включения/выключения оружия нажмите клавишу <kbd>Левый Shift</kbd>.
            Попробуйте поймать убегающий кружок.
        </div>
        <style jsx>{`
            .help {
                position: absolute;
                width: 300px;
                color: white;
                padding: 10px;
                top: 0;
                right: 0;
            }
        `}</style>
    </>;
}
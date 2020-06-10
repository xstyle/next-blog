import Head from 'next/head'

const ARROW_UP = 'ArrowUp'
const ARROW_DOWN = 'ArrowDown'
const ARROW_LEFT = 'ArrowLeft'
const ARROW_RIGHT = 'ArrowRight'
const SHIFT_LEFT = 'ShiftLeft'

const SPEED = 2;

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
            arrow_down: false
        }
        this.step = this.step.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        setInterval(this.step, 1000 / 60);
        console.log(this.container.offsetWidth, this.container.offsetHeight)
        this.setState({ top: (this.container.offsetHeight - 100) / 2, left: (this.container.offsetWidth - 100) / 2 })
    }

    step() {
        const state = {
            left: this.state.left,
            top: this.state.top,
            rotate: this.state.rotate
        }
        if (this.state.arrow_up) {
            state.top = this.beetween(state.top - Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetHeight - 100)
            state.left = this.beetween(state.left - Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetWidth - 100)
        }
        if (this.state.arrow_down) {
            state.top = this.beetween(state.top + Math.sin((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetHeight - 100)
            state.left = this.beetween(state.left + Math.cos((state.rotate + 90) * Math.PI / 180) * SPEED, 0, this.container.offsetWidth - 100)
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
                this.setState({ shift_left: true })
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
            case SHIFT_LEFT:
                this.setState({ shift_left: false })
                break
            default:
                break
        }
    }
    render() {
        return <>
            <div id="container"
                ref={el => this.container = el}>
                <Target container={this.container} top={this.state.top} left={this.state.left} />
                <div
                    className="robot"
                    style={{
                        top: this.state.top,
                        left: this.state.left,
                        transform: `rotate(${this.state.rotate}deg)`
                    }}>
                    <div className="robot-body"></div>
                    {/* <div>x: {Math.round(this.state.top)}</div>
                    <div>y: {Math.round(this.state.left)}</div>
                    <div>{this.state.rotate}˚</div> */}
                    <div className="front-wheel wheel"></div>
                    <div className="rear-wheel wheel"></div>
                    <div className={"circular-saw" + (this.state.shift_left ? " rotate" : "")}>+</div>
                </div>
            </div>
            <style jsx>{`
                .robot {
                    position: relative;
                    display: inline-block;
                    height: 100px;
                    width: 100px;
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
            top: 100,
            left: 100,
            direction: 0
        }
        this.step = this.step.bind(this)
        this.changeDirection = this.changeDirection.bind(this);
    }
    componentDidMount() {
        setInterval(this.step, 1000 / 60)
        //setInterval(this.changeDirection, 5000)
    }
    step() {
        const diff_top = this.props.top - this.state.top;
        const diff_left = this.props.left - this.state.left;
        const c = Math.sqrt(Math.pow(diff_top, 2) + Math.pow(diff_left, 2))
        let speed = SPEED * (1 - c / this.props.container.offsetWidth) * 3
        speed = speed > 0.1 ? speed : 0
        this.setState({
            left: this.beetween(this.state.left + Math.sin((this.state.direction + 90) * Math.PI / 180) * speed, 0, this.props.container.offsetWidth - 50),
            top: this.beetween(this.state.top + Math.cos((this.state.direction + 90) * Math.PI / 180) * speed, 0, this.props.container.offsetHeight - 50)
        }, () => {
            if (this.state.top === 0 ||
                this.state.top === this.props.container.offsetHeight - 50 ||
                this.state.left === 0 ||
                this.state.left === this.props.container.offsetWidth - 50
            ) {
                this.changeDirection()
            }
        })
    }

    beetween(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }

    changeDirection() {
        const diff_top = this.props.top - this.state.top;
        const diff_left = this.props.left - this.state.left;
        const c = Math.sqrt(Math.pow(diff_top, 2) + Math.pow(diff_left, 2))
        const cosLeft = diff_left / c;
        const angleRadian = Math.acos(cosLeft)
        const angle = (angleRadian / Math.PI * 180 * (diff_top < 0 ? 1 : -1)) + 360 * (diff_top < 0 ? 0 : 1)
        console.log(`angle ${angle}`)

        const zone = 90 * Math.max(1 - c / this.props.container.offsetHeight, 0.5)
        let new_direction = Math.random() * (360 - zone);
        if (new_direction >= (angle - zone / 2)) {
            new_direction += zone;
        }

        this.setState({ direction: new_direction })
    }

    render() {
        return <>
            <div className="target"
                style={{ top: this.state.top, left: this.state.left }}>
                {/* <div>{Math.round(this.state.top)}</div>
                <div>{Math.round(this.state.left)}</div>
                <div>{Math.round(this.state.direction)}</div> */}
            </div>
            <style jsx>{`
                .target {
                    position: absolute;
                    width: 50px;
                    height: 50px;
                    background-color: yellow;
                    border-radius: 50%;
                    text-align: center;
                }
            `}</style>
        </>
    }
}
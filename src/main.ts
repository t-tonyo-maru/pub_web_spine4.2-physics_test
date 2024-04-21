import './reset.css'
import * as Spine from '@esotericsoftware/spine-webgl'
import GUI from 'lil-gui'

const isDev = import.meta.env.MODE === 'development'

/**
 * https://github.com/EsotericSoftware/spine-runtimes/blob/4.2/spine-ts/spine-webgl/example/mix-and-match.html
 */
class SpineApp implements Spine.SpineCanvasApp {
  private skeleton: unknown // type: spine.Skeleton
  private state: unknown // type: spine.AnimationState

  loadAssets(canvas: Spine.SpineCanvas): void {
    canvas.assetManager.loadTextureAtlas('model.atlas')
    canvas.assetManager.loadJson('model.json')
  }

  initialize(canvas: Spine.SpineCanvas): void {
    const assetManager = canvas.assetManager

    const atlas = canvas.assetManager.require('model.atlas')
    const atlasLoader = new Spine.AtlasAttachmentLoader(atlas)
    const skeletonJson = new Spine.SkeletonJson(atlasLoader)
    const skeletonData = skeletonJson.readSkeletonData(
      assetManager.require('model.json')
    )

    this.skeleton = new Spine.Skeleton(skeletonData)

    if (this.skeleton instanceof Spine.Skeleton) {
      this.skeleton.scaleX = 0.5 * devicePixelRatio
      this.skeleton.scaleY = 0.5 * devicePixelRatio
      this.skeleton.x = 0
      this.skeleton.y =
        (-1 * Math.floor(this.skeleton.data.height * 0.5 * devicePixelRatio)) /
        2
      this.skeleton.setToSetupPose()
      this.skeleton.update(0)
      this.skeleton.updateWorldTransform(Spine.Physics.update)

      // lil-gui
      const spineFolder = gui.addFolder('spine')
      // x
      spineFolder.add(
        this.skeleton,
        'x',
        -200 * devicePixelRatio ** 2,
        200 * devicePixelRatio ** 2,
        1 / devicePixelRatio
      )
      // wind
      const windContoller = spineFolder.add({ wind: 0 }, 'wind', -20, 20, 1)
      windContoller.onChange((value: number) => {
        if (!(this.skeleton instanceof Spine.Skeleton)) return
        this.skeleton.data.physicsConstraints.map((c) => {
          c.wind = value
        })
        this.skeleton.setToSetupPose()
        // WARING: skeleton.update() と skeleton.updateWorldTransform() は、本当に必要か未検証。
        // skeleton.setToSetupPose() だけでも動作するので、不要かも？
        this.skeleton.update(0)
        this.skeleton.updateWorldTransform(Spine.Physics.update)
      })
    }

    const stateData = new Spine.AnimationStateData(skeletonData)
    this.state = new Spine.AnimationState(stateData)
    if (this.state instanceof Spine.AnimationState) {
      this.state.setAnimation(0, 'animation', true)
    }
  }

  update(_canvas: Spine.SpineCanvas, delta: number): void {
    if (!(this.skeleton instanceof Spine.Skeleton)) return
    if (!(this.state instanceof Spine.AnimationState)) return

    this.state.update(delta)
    this.state.apply(this.skeleton)
    this.skeleton.update(delta)
    this.skeleton.updateWorldTransform(Spine.Physics.update)
  }

  render(canvas: Spine.SpineCanvas): void {
    if (!(this.skeleton instanceof Spine.Skeleton)) return

    const renderer = canvas.renderer
    renderer.resize(Spine.ResizeMode.Expand)
    canvas.clear(0.8, 0.8, 0.8, 1)
    renderer.begin()
    renderer.drawSkeleton(this.skeleton, true)
    renderer.end()
  }

  error(_canvas: Spine.SpineCanvas, errors: Spine.StringMap<string>): void {
    console.error('Error!')
    console.error(errors)
  }
}

const devicePixelRatio = window.devicePixelRatio || 1
const app = document.querySelector<HTMLDivElement>('#app')!
const canvas = document.createElement('canvas')
canvas.style.position = 'absolute'
canvas.style.width = '100%'
canvas.style.height = '100%'
app.appendChild(canvas)

const gui = new GUI()

new Spine.SpineCanvas(canvas, {
  pathPrefix: isDev
    ? 'assets/spine-data/'
    : 'https://t-tonyo-maru.github.io/pub_web_spine4.2-physics_test/assets/spine-data/',
  app: new SpineApp()
})

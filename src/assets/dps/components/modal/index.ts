/* eslint-disable import/prefer-default-export, @stylistic/lines-between-class-members */

/** Modal dialogue box component */
export class Modal {
  public static readonly showTriggerClassName = 'hmpps-modal__trigger-show'
  public static readonly hideTriggerClassName = 'hmpps-modal__trigger-hide'

  private static readonly modals = new Map<string, Modal>()

  /** Initialise all modal components rendered in the document; none will automatically open */
  public static init(): void {
    document.querySelectorAll<HTMLDivElement>('[data-module="hmpps-modal"]').forEach(element => {
      const modal = new this(element)
      this.modals.set(modal.id, modal)
    })
    document.querySelectorAll<HTMLElement>(`.${this.showTriggerClassName}`).forEach(element => {
      const modalId = element.dataset.hmppsModalId
      if (modalId) {
        element.addEventListener('click', event => {
          const modal = this.modals.get(modalId)
          if (modal) {
            event.preventDefault()
            if (element.dataset.hmppsModalUrl) {
              modal.load(element.dataset.hmppsModalUrl)
            } else {
              modal.show()
            }
          }
        })
      }
    })
  }

  /** Find an instance of the `Modal` class to programmatically control it */
  public static getById(modalId: string): Modal | undefined {
    return this.modals.get(modalId)
  }

  /** Hide all showing modals */
  public static hideAll(): void {
    this.modals.forEach(modal => {
      if (modal.isShowing) {
        modal.hide()
      }
    })
  }

  private readonly dialog: HTMLDialogElement
  private readonly content: HTMLElement
  private showing: boolean

  constructor(private readonly root: HTMLDivElement) {
    this.root.hidden = true
    this.showing = false

    this.dialog = root.querySelector('.hmpps-modal__dialogue-box')!
    this.content = root.querySelector('.hmpps-modal__content')!

    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
    this.maintainFocus = this.maintainFocus.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)

    this.attachHideTriggers(this.root.querySelectorAll(`.${Modal.hideTriggerClassName}`))
  }

  public get id(): string {
    return this.root.id
  }

  public get isShowing(): boolean {
    return this.showing
  }

  private attachHideTriggers(elements: { forEach: (callback: (element: HTMLElement) => void) => void }): void {
    elements.forEach(element =>
      element.addEventListener('click', event => {
        this.hide()
        event.preventDefault()
      }),
    )
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.hide()
    } else if (event.key === 'Tab') {
      this.trapFocus(event)
    }
  }

  private previouslyFocused: HTMLElement | undefined

  private takeFocus(): void {
    if (document.activeElement) {
      this.previouslyFocused = document.activeElement as HTMLElement
    }
    this.dialog.focus()
  }

  private maintainFocus(event: FocusEvent): void {
    const isInModal = (event.target as HTMLElement)?.closest('[aria-modal="true"]')
    if (!isInModal) {
      this.takeFocus()
    }
  }

  private revertFocus(): void {
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus()
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusableChildren = this.getFocusableChildren()
    if (focusableChildren.length === 0) {
      event.preventDefault()
      return
    }
    const focusedItemIndex = focusableChildren.indexOf(document.activeElement as HTMLElement)
    const lastIndex = focusableChildren.length - 1

    if (event.shiftKey && focusedItemIndex === 0) {
      focusableChildren[lastIndex].focus()
      event.preventDefault()
    } else if (!event.shiftKey && focusedItemIndex === lastIndex) {
      focusableChildren[0].focus()
      event.preventDefault()
    }
  }

  private getFocusableChildren(): HTMLElement[] {
    return Array.from(
      this.root.querySelectorAll<HTMLElement>(`
        a[href]:not([disabled]),
        button:not([disabled]),
        textarea:not([disabled]),
        input[type="text"]:not([disabled]),
        input[type="radio"]:not([disabled]),
        input[type="checkbox"]:not([disabled]),
        select:not([disabled])
      `),
    ).filter(element => element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  }

  /** Show the modal dialog box */
  public show(): void {
    Modal.hideAll()

    this.root.removeAttribute('hidden')
    this.dialog.ariaModal = 'true'

    this.takeFocus()

    document.addEventListener('keydown', this.handleKeyDown)
    document.body.addEventListener('focus', this.maintainFocus, true)

    document.documentElement.style.overflowY = 'hidden'

    this.showing = true
  }

  /** Hide the modal dialog box */
  public hide(): void {
    this.root.hidden = true
    this.dialog.removeAttribute('aria-modal')

    document.removeEventListener('keydown', this.handleKeyDown)
    document.body.removeEventListener('focus', this.maintainFocus, true)

    this.revertFocus()

    document.documentElement.style.overflowY = ''

    this.showing = false
  }

  /** Show modal dialog box with loading graphic while loading HTML content from `url` */
  public async load(url: string | URL): Promise<void> {
    this.replaceContentWithTemplate('loading-graphic')
    this.show()
    try {
      const response = await fetch(url)
      if (response?.ok) {
        this.content.innerHTML = await response.text()
        this.attachHideTriggers(this.content.querySelectorAll(`.${Modal.hideTriggerClassName}`))
      } else {
        this.replaceContentWithTemplate('error-message')
      }
    } catch {
      this.replaceContentWithTemplate('error-message')
    }
  }

  private replaceContentWithTemplate(template: 'error-message' | 'loading-graphic'): void {
    this.content.replaceChildren()
    const loadingGraphic = document.importNode(
      this.root.querySelector<HTMLTemplateElement>(`.hmpps-modal__${template}-template`)!.content,
      true,
    )
    this.content.appendChild(loadingGraphic)
  }
}

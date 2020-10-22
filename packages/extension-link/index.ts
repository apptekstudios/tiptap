import {
  Command, createMark, markPasteRule,
} from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export interface LinkOptions {
  openOnClick: boolean,
  target: string,
  rel: string,
}

// export type LinkCommand = (options: {href?: string, target?: string}) => Command

// declare module '@tiptap/core/src/Editor' {
//   interface Commands {
//     link: LinkCommand,
//   }
// }

export const pasteRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%_+.~#?&//=]*)/gi

export default createMark({
  name: 'link',

  inclusive: false,

  defaultOptions: <LinkOptions>{
    openOnClick: true,
    target: '_blank',
    rel: 'noopener noreferrer nofollow',
  },

  addAttributes() {
    return {
      href: {
        default: null,
        rendered: false,
      },
      target: {
        default: null,
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]',
        getAttrs: node => ({
          href: (node as HTMLElement).getAttribute('href'),
          target: (node as HTMLElement).getAttribute('target'),
        }),
      },
    ]
  },

  renderHTML({ mark, attributes }) {
    return ['a', {
      ...attributes,
      ...mark.attrs,
      rel: this.options.rel,
      target: mark.attrs.target ? mark.attrs.target : this.options.target,
    }, 0]
  },

  addCommands() {
    return {
      link: attributes => ({ commands }) => {
        if (!attributes.href) {
          return commands.removeMark('link')
        }

        return commands.updateMark('link', attributes)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-i': () => this.editor.italic(),
    }
  },

  addPasteRules() {
    return [
      markPasteRule(pasteRegex, this.type, (url: string) => ({ href: url })),
    ]
  },

  addProseMirrorPlugins() {
    if (!this.options.openOnClick) {
      return []
    }

    return [
      new Plugin({
        key: new PluginKey('handleClick'),
        props: {
          handleClick: (view, pos, event) => {
            const attrs = this.editor.getMarkAttrs('link')

            if (attrs.href && event.target instanceof HTMLAnchorElement) {
              window.open(attrs.href, attrs.target)

              return false
            }

            return true
          },
        },
      }),
    ]
  },
})

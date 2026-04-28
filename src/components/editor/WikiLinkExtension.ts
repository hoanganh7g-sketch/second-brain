import { Mark, mergeAttributes } from '@tiptap/core'

export const WikiLink = Mark.create({
  name: 'wikiLink',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      target: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-wiki-link': true,
      class: 'wiki-link',
    }), 0]
  },
})

// Regex to detect [[...]] patterns
export const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g

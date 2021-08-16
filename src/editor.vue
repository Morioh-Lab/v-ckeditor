<template>
    <div ref="root"></div>
</template>

<script>

    import { onMounted, onBeforeUnmount, ref, computed, inject, watchEffect } from 'vue';

    import { debounce, register, isBlank } from '@morioh/helper';

    export default {
        name: 'editor',

        props: {
            modelValue: String,
            config: {
                type: Object,
                default: () => ({})
            },
            disabled: {
                type: Boolean,
                default: false
            }
        },
        emits: ['ready', 'change', 'input', 'blur', 'focus', 'update:modelValue', 'destroy'],

        setup(props, { emit }) {

            let instance = null;
            let data = '';
            const root = ref(null);
            const config = inject('editor');

            const MentionCustomization = (editor) => {
                // The upcast converter will convert <a class="mention" href="" data-user-id="">
                // elements to the model 'mention' attribute.
                editor.conversion.for('upcast').elementToAttribute({
                    view: {
                        name: 'a',
                        key: 'data-mention',
                        classes: 'mention',
                        attributes: {
                            href: true,
                            'data-id': true
                        }
                    },
                    model: {
                        key: 'mention',
                        value: viewItem => {
                            // The mention feature expects that the mention attribute value
                            // in the model is a plain object with a set of additional attributes.
                            // In order to create a proper object, use the toMentionAttribute helper method:
                            const mentionAttribute = editor.plugins.get('Mention').toMentionAttribute(viewItem, {
                                // Add any other properties that you need.
                                href: viewItem.getAttribute('href'),
                                _id: viewItem.getAttribute('data-id')
                            });

                            return mentionAttribute;
                        }
                    },
                    converterPriority: 'high'
                });

                // Downcast the model 'mention' text attribute to a view <a> element.
                editor.conversion.for('downcast').attributeToElement({
                    model: 'mention',
                    view: (modelAttributeValue, { writer }) => {
                        // Do not convert empty attributes (lack of value means no mention).
                        if (!modelAttributeValue) {
                            return;
                        }

                        return writer.createAttributeElement('a', {
                            class: 'mention',
                            'data-mention': modelAttributeValue.id,
                            'data-id': modelAttributeValue._id,
                            'href': modelAttributeValue.href
                        }, {
                            // Make mention attribute to be wrapped by other attribute elements.
                            priority: 20,
                            // Prevent merging mentions together.
                            id: modelAttributeValue.uid
                        });
                    },
                    converterPriority: 'high'
                });
            }

            const defaults = {
                extraPlugins: [MentionCustomization],
                // blockToolbar: ["heading", "|", "bulletedList", "numberedList", "|", "outdent", "indent", "blockQuote", "|", "insertImage", "codeBlock", "insertTable", "|", "undo", "redo", "removeFormat"],
                blockToolbar: ["heading", "|", "bulletedList", "numberedList", "|", "outdent", "indent", "blockQuote", "|", "insertImage", "|", "undo", "redo", "removeFormat"],
                // toolbar: { items: ["bold", "italic", "link"] },
                toolbar: { items: ["heading", "|", "bold", "italic", "link", "|", "blockQuote", "insertImage"] },
                image: { toolbar: ["imageStyle:block", "|", "toggleImageCaption"] },
                // table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", 'tableCellProperties', 'tableProperties'] },
                placeholder: "Let's write an awesome story!",
                heading: {
                    options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
                    ]
                }

            };

            const create = () => {
                const o = Object.assign({}, defaults, config, props.config, { initialData: props.modelValue || '' });

                if (isBlank(o.CDN_CSS)) {
                    throw new Error('Please config CDN_CSS');
                }

                if (isBlank(o.CDN_JS)) {
                    throw new Error('Please config CDN_JS');
                }

                register('link', { id: 'ckeditor-css', href: o.CDN_CSS, type: 'text/css', rel: 'stylesheet' });
                register('script', { id: 'ckeditor-js', src: o.CDN_JS, async: true }).then(() => {

                    CKEditor.create(root.value, o).then(editor => {
                        // Save the reference to the $_Editor for further use.
                        instance = editor;

                        // Set initial disabled state.
                        editor.isReadOnly = props.disabled;

                        editor.model.document.on('change:data', debounce((evt) => {

                            const html = data = editor.getData();

                            const text = root.value.innerText;

                            emit('update:modelValue', html, editor);
                            emit('change', { html, text }, editor);

                        }), 500);

                        editor.editing.view.document.on('focus', evt => {
                            emit('focus', evt, editor);
                        });

                        editor.editing.view.document.on('blur', evt => {
                            emit('blur', evt, editor);
                        });

                        // Let the world know the editor is ready.
                        emit('ready', editor);
                    }).catch(error => { console.error(error); });

                });



            }


            onMounted(() => create());
            watchEffect(() => create());

            // watch(() => props.modelValue, (newValue, oldValue) => {
            //     // console.log(props.modelValue, newValue, oldValue)
            //     if (instance && newValue !== oldValue && newValue !== data) {
            //         instance.setData(newValue);
            //     }
            // });

            // watch(() => props.disabled, (newValue, oldValue) => {
            //     instance.isReadOnly = newValue;
            // });

            onBeforeUnmount(() => {

                if (instance) {
                    instance.destroy();
                    instance = null;
                }
                // Note: By the time the editor is destroyed (promise resolved, editor#destroy fired)
                // the Vue component will not be able to emit any longer. So emitting #destroy a bit earlier.
                emit('destroy', instance);
            })

            return { root, Editor: computed(() => instance) };

        }

    }

</script>
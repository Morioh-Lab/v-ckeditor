import Editor from './editor.vue';
export { Editor };

export default {
    install: function (vm, config) {
        vm.component(Editor.name, Editor);
        if (config) {
            vm.provide('editor', options);
        }
    }
};

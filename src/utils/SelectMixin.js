import Vue from 'vue'

export default {
    props: {
        value: [String, Number],
        size: String,
        placeholder: String,
        disabled: Boolean,
        searchable: Boolean,
        expanded: Boolean
    },
    data() {
        return {
            options: [],
            selected: null,
            hovered: null,
            isActive: false,
            inputValue: null,
            isListInViewport: true,
            isSelectComponent: true // Used internally by Option
        }
    },
    computed: {
        statusType() {
            if (this.$parent.isFieldComponent) {
                return this.$parent.newType
            }
        },
        searchOptions() {
            if (!this.inputValue || this.selected !== null &&
                this.selected.label === this.inputValue) {
                return this.options
            }

            this.isActive = true
            return this.options.filter((option) => {
                return option.label
                    .toString()
                    .toLowerCase()
                    .indexOf(this.inputValue.toLowerCase()) >= 0
            })
        }
    },
    watch: {
        /**
         * When dropdown is activated or deactivated checks the visibility
         * to know when to open upwards.
         * Also sets the previously selected option if deactivating.
         */
        isActive() {
            if (!this.isActive) {
                // Wait for the animation to finish before recalculating
                setTimeout(() => {
                    this.calcListInViewport()
                    if (this.selected !== null) {
                        this.inputValue = this.selected.label
                        // Set scroll position to selected item
                        if (this.$refs[this._uid + this.selected.value] !== undefined) {
                            this.$refs.list.scrollTop = this
                                .$refs[this._uid + this.selected.value][0]
                                .offsetTop
                        }
                    }
                }, 100)
            } else {
                this.calcListInViewport()
                if (this.searchable) {
                    this.$refs.input.select()
                }
            }
        },

        /**
         * When v-model is changed, sets the new selected option.
         */
        value(value) {
            if (value === null || value === '') {
                this.selectOption(null)
                this.inputValue = null
                return
            }

            this.options.forEach((option) => {
                if (option.value === value) {
                    this.selectOption(option)
                    return
                }
            })
        },

        /**
         * When selected, changes the input value.
         */
        selected(option) {
            if (!option) return

            this.$emit('input', option.value)
            this.$emit('change', option.value)
            this.inputValue = option.label
        }
    },
    methods: {
        /**
         * Sets which option is currently selected.
         */
        selectOption(option, index) {
            if (option === undefined) return

            this.selected = option
            this.hoverOption(option)
        },

        /**
         * Sets which option is currently hovered.
         * Also emulates native <select> arrow selecting
         */
        hoverOption(option, index) {
            if (option === undefined || option === this.hovered) return

            if (index !== undefined) {
                const list = this.$refs.list
                const element = this.$refs[this._uid + option.value][0]
                const visMin = list.scrollTop
                const visMax = list.scrollTop + list.clientHeight - element.clientHeight

                if (element.offsetTop < visMin) {
                    list.scrollTop = element.offsetTop
                } else if (element.offsetTop >= visMax) {
                    list.scrollTop = element.offsetTop - list.clientHeight + element.clientHeight
                }
            }
            this.hovered = option
        },

        /**
         * Closes dropdown if clicked outside.
         */
        clickedOutside(event) {
            if (event.target !== this.$refs.input &&
                event.target !== this.$refs.list &&
                event.target !== this.$refs.button) {
                this.isActive = false
            }
        },

        /**
         * Calculates if the dropdown list is visible when activated,
         * it'll be opened upwards if not.
         */
        calcListInViewport() {
            Vue.nextTick(() => {
                const rect = this.$refs.list.getBoundingClientRect()

                this.isListInViewport = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight ||
                        document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth ||
                        document.documentElement.clientWidth)
                )
            })
        },

        /**
         * Verify if next item is a subheader (another group chunk).
         */
        isSubheader(option, previousOption, i) {
            if (!option.group) return
            // If it's first and has group property already show as subheader
            if (i === 0) return true

            if (previousOption === undefined) return
            return option.group !== previousOption.group
        },

        /**
         * When the keyboard arrows are pressed while input is focused
         * sets which option is currently hovered if the dropdown is active,
         * or sets selected option if dropdown is not active (just like native <select>).
         */
        inputArrows(direction) {
            const sum = direction === 'down' ? 1 : -1
            if (!this.isActive) {
                const index = this.options.indexOf(this.hovered) + sum
                this.selectOption(this.options[index], index)
            } else {
                const index = this.searchOptions.indexOf(this.hovered) + sum
                this.hoverOption(this.searchOptions[index], index)
            }
        },

        /**
         * When enter is pressed while input is focused
         * selects the hovered option and closes the dropdown.
         */
        inputEnter() {
            this.selectOption(this.hovered)
            this.isActive = false
        }
    },
    created() {
        document.addEventListener('click', this.clickedOutside)
    },
    beforeDestroy() {
        document.removeEventListener('click', this.clickedOutside)
    }
}
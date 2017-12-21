 exports.description = 'Focus next element'
 exports.keys = 'down';
 exports.execute = function name($) {
   const x = $(document.activeElement)
   if (!x || !x.hasClass('filesystem-item')) {
     const selector = `.area-${(this.state.activeAreaIndex)}:first`
     $(selector).find('.filesystem-item:first').focus()
   } else {
     x.next().focus()
   }
   this.setState({
     activeAreaIndex: $(document.activeElement).data('area-index') || this.state.activeAreaIndex
   })
 }

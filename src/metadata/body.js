module.exports = ($) => {
  return $('*')
    .each(function () {
      $(this).append(' ')
    })
    .find('p, li, span, option, form, button, input, header, .btn')
    .text()
    .replace(/\s\s+/g, ' ')
}

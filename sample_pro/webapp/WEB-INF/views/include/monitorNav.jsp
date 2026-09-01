<%@ page contentType="text/html; charset=UTF-8" %>
<div class="monitor-nav">
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/plc/PlcReadWrite" href="<%=request.getContextPath()%>/plc/PlcReadWrite">PLC</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/alarm/manage" href="<%=request.getContextPath()%>/alarm/manage">ALARM MANAGE</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/alarm/monitor" href="<%=request.getContextPath()%>/alarm/monitor">ALARM MONITOR</a>

  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/temp/manage" href="<%=request.getContextPath()%>/temp/manage">TEMP MANAGE</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/temp/monitor" href="<%=request.getContextPath()%>/temp/monitor">TEMP MONITOR</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/alarm/temp" href="<%=request.getContextPath()%>/alarm/temp">ALARM TEMP</a>

  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/tag/TagWorkPage" href="<%=request.getContextPath()%>/tag/TagWorkPage">TAG MANAGE</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/tag/TagMonitorPage" href="<%=request.getContextPath()%>/tag/TagMonitorPage">TAG MONITOR</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/manual" href="<%=request.getContextPath()%>/manual">MANUAL</a>
  <a class="monitor-nav__item" data-path="<%=request.getContextPath()%>/expage" href="<%=request.getContextPath()%>/expage">EXPAGE</a>
</div>
<script>
(function () {
  var items = document.querySelectorAll('.monitor-nav__item');
  var path = window.location.pathname;
  for (var i = 0; i < items.length; i++) {
    var p = items[i].getAttribute('data-path');
    if (!p) continue;
    if (path === p || path === p + '/' || path.indexOf(p + '/') === 0) {
      items[i].classList.add('active');
    }
  }
})();
</script>

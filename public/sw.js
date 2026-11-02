// Recebe o resumo diário enviado pelo servidor e abre o app ao tocar na notificação.
self.addEventListener("push", (event) => {
  const { title = "Dusk", body = "" } = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(title, { body, icon: "/icon.svg", tag: "dusk-resumo-diario" }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => "focus" in client);
      if (!open) return self.clients.openWindow("/tasks/today");
      return open.focus().then((client) => client.navigate("/tasks/today"));
    }),
  );
});

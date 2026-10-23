import { expect, test } from "@playwright/test";

test("un cliente reserva, ve su código y cancela; la hora vuelve a quedar libre", async ({ page }) => {
  await page.goto("/n/barberia-el-parche");
  await expect(page.getByRole("heading", { name: "Barbería El Parche" })).toBeVisible();

  await page.locator(".servicio", { hasText: "Corte clásico" }).click();
  const primeraHora = page.locator(".hora").first();
  const hora = (await primeraHora.textContent())!.trim();
  await primeraHora.click();

  await page.getByLabel("Tu nombre").fill("Valentina Rojas");
  await page.getByLabel("Celular").fill("301 456 7890");
  await page.getByRole("button", { name: `Reservar a las ${hora}` }).click();

  await expect(page.getByRole("heading", { name: "Quedó tu reserva" })).toBeVisible();
  const codigo = (await page.locator(".confirmacion__codigo strong").textContent())!.trim();
  expect(codigo).toMatch(/^[A-Z2-9]{6}$/);

  await page.getByRole("link", { name: "Ver o cancelar mi reserva" }).click();
  await expect(page.getByText("Valentina Rojas")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar mi reserva" }).click();
  await page.getByRole("button", { name: "Sí, cancelar" }).click();
  await expect(page.locator(".estado")).toHaveText("Cancelada");

  await page.getByRole("link", { name: "Reservar otra hora" }).click();
  await page.locator(".servicio", { hasText: "Corte clásico" }).click();
  await expect(page.locator(".hora").filter({ hasText: hora }).first()).toBeVisible();
});

test("el dueño ve la reserva nueva en su agenda y la marca como atendida", async ({ page }) => {
  await page.goto("/n/barberia-el-parche");
  await page.locator(".servicio", { hasText: "Cejas y perfilado" }).click();
  await page.locator(".hora").first().click();
  await page.getByLabel("Tu nombre").fill("Mateo Prueba");
  await page.getByLabel("Celular").fill("3009998877");
  await page.getByRole("button", { name: /Reservar a las/ }).click();
  await expect(page.getByRole("heading", { name: "Quedó tu reserva" })).toBeVisible();
  const cuando = await page.locator(".confirmacion .muted").first().textContent();
  const dia = Number(cuando!.match(/(\d+) de/)![1]);

  await page.goto("/panel");
  await page.locator(".semana__dia").first().waitFor();
  await expect(page.locator(".semana__cuenta").first()).not.toHaveText(" ");
  // La cita puede caer en la semana siguiente si hoy ya no quedan cupos.
  const elDia = page.locator(".semana__dia").filter({ has: page.locator(".semana__numero", { hasText: new RegExp(`^${dia}$`) }) });
  if (!(await elDia.count())) await page.getByRole("button", { name: "Semana siguiente" }).click();
  await elDia.click();
  const cita = page.locator(".cita", { hasText: "Mateo Prueba" });
  await expect(cita).toBeVisible();
  await cita.getByRole("button", { name: "Atendida" }).click();
  await expect(cita.locator(".estado")).toHaveText("Atendida");
});

test("no se puede reservar con un celular mal escrito", async ({ page }) => {
  await page.goto("/n/barberia-el-parche");
  await page.locator(".hora").first().click();
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByLabel("Celular").fill("12");
  await page.getByRole("button", { name: /Reservar a las/ }).click();
  await expect(page.locator(".error")).toHaveText("El celular no parece válido.");
});

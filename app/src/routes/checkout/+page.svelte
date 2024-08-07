<script lang="ts">
  import { browser } from "$app/environment";
  import { enhance } from "$app/forms";
  import Button from "$lib/components/UI/Button.svelte";
  import Select from "$lib/components/UI/Select.svelte";
  import OrderItem from "$lib/components/OrderItem.svelte";
  import { currentCity } from "$lib/stores/currentCity";
  import { deliveryType } from "$lib/stores/deliveryType";
  import { deliveryOffice } from "$lib/stores/deliveryOffice";
  import { deliveryDateAndPrice } from "$lib/stores/deliveryDateAndPrice";
  import { deliveryStepDone } from "$lib/stores/deliveryStepDone";
  import { userInfoStepDone } from "$lib/stores/userInfoStepDone";
  import { userInputData } from "$lib/stores/userInputData";

  type FieldName = keyof typeof $userInputData;

  export let form;
  export let data;

  let innerWidth: number;

  let closest_cities: CdekCity[] = [];
  let map: any;
  let incompleted_validations = new Set([
    "fullname",
    "phone",
    "email",
    "agree",
  ]);

  for (const field of Object.values($userInputData)) {
    if (incompleted_validations.has(field.name) && field.valid) {
      incompleted_validations.delete(field.name);
    }
  }

  $: if (incompleted_validations.size === 0) {
    userInfoStepDone.set(true);
  } else {
    userInfoStepDone.set(false);
  }

  $: if (browser && $deliveryType === "pickup" && !$deliveryStepDone) {
    DG.then(() => {
      map = DG.map("map", {
        center: JSON.parse($currentCity.latlng),
        zoom: 13,
      });

      drawDeliveryPoints();

      calculateDelivery();
    });
  }

  $: total = data.order_items.reduce(
    (accum, cart_item) => {
      return (accum += cart_item.product.price * cart_item.quantity);
    },
    browser ? $deliveryDateAndPrice?.total_sum : 0
  );

  function validateInput(event: Event) {
    const target = event.target as HTMLInputElement;

    if (target.validity.valid) {
      incompleted_validations.delete(target.name);

      userInputData.set({
        ...userInputData.get(),
        [target.name]: {
          ...userInputData.get()[target.name as FieldName],
          valid: true,
        },
      });
    } else {
      incompleted_validations.add(target.name);

      userInputData.set({
        ...userInputData.get(),
        [target.name]: {
          ...userInputData.get()[target.name as FieldName],
          valid: false,
        },
      });
    }

    incompleted_validations = incompleted_validations;
  }

  function validateCheckbox(event: Event) {
    const target = event.target as HTMLInputElement;

    if (target.checked) {
      incompleted_validations.delete(target.name);
    } else {
      incompleted_validations.add(target.name);
    }

    incompleted_validations = incompleted_validations;
  }

  function getCurrentPosition() {
    window.navigator.geolocation.getCurrentPosition(({ coords }) => {
      for (const city of data.cdek_cities) {
        const lat = Math.abs(city.latitude - coords.latitude);
        const lng = Math.abs(city.longitude - coords.longitude);

        if (lat < 0.2 && lng < 0.2) {
          closest_cities = [...closest_cities, city];
        }
      }

      if (closest_cities.length > 0) {
        updateCity(closest_cities[0]);
      }
    });
  }

  function onCityChange(event: Event) {
    const city_code = Number((event.target as HTMLSelectElement).value);
    const city = data.cdek_cities.find(({ code }) => code === city_code);

    if (city) {
      updateCity(city);
    }
  }

  function updateCity(city: CdekCity) {
    currentCity.set({
      cdek_city_code: city.code.toString(),
      latlng: JSON.stringify([city.latitude, city.longitude]),
    });

    deliveryOffice.set(null);

    calculateDelivery();

    if (map) {
      map.setView([city.latitude, city.longitude], 13);
      drawDeliveryPoints();
    }
  }

  function drawDeliveryPoints() {
    fetch(`/api/cdek/deliverypoints/${$currentCity.cdek_city_code}`)
      .then((res) => res.json())
      .then((data) => {
        const icon = DG.divIcon({
          className: "map-cdek-marker",
          iconSize: [35, 35],
        });

        for (const deliverypoint of data) {
          const marker = DG.marker(
            [deliverypoint.location.latitude, deliverypoint.location.longitude],
            {
              icon,
              title: deliverypoint.name,
              alt: deliverypoint.name,
              riseOnHover: true,
              payload: deliverypoint,
            }
          );

          marker.addTo(map);

          marker.on("click", (data: any) => {
            deliveryOffice.set(data.target.options.payload);
          });
        }
      });
  }

  function calculateDelivery() {
    fetch(`/api/cdek/calculator/${$currentCity.cdek_city_code}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => deliveryDateAndPrice.set(data));
  }
</script>

<svelte:window bind:innerWidth />

{#if innerWidth < 600}
  <details class="order-details-mobile">
    <summary class="flex items-center gap-4">
      <h2 class="shrink-0 font-semibold">Ваш заказ</h2>

      <ul class="flex gap-4 grow overflow-auto">
        {#each data.order_items as order_item (order_item.id)}
          <li class="shrink-0">
            <img
              class="w-12 aspect-square rounded object-cover"
              src={order_item.product.image}
              alt={order_item.product.title}
              decoding="async"
              loading="eager"
            />
          </li>
        {/each}
      </ul>

      <svg
        class="shrink-0 chevron ml-auto"
        width="20"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentcolor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="48"
          d="M184 112l144 144-144 144"
        />
      </svg>
    </summary>

    <ul class="grid gap-7 mt-4">
      {#each data.order_items as order_item (order_item.id)}
        <li>
          <OrderItem {order_item} />
        </li>
      {/each}
    </ul>
  </details>

  <small class="block text-sm mt-5">
    Если вы случайно перезагрузите страницу, то введенная информация все равно
    сохранится.
  </small>
{/if}

<div class="grid md:grid-cols-[1fr_27rem] gap-16 mt-8 pb-10 md-pb-0 md:mt-5">
  <div>
    <details open>
      <summary
        class="relative flex items-center justify-between pointer-events-none"
      >
        <h2 class="flex items-center text-2xl font-bold">
          <span>Доставка</span>

          {#if $deliveryStepDone}
            <svg
              class="w-[1lh] h-[1lh] ml-3 text-emerald-700"
              viewBox="0 0 512 512"
              aria-hidden="true"
              fill="currentcolor"
            >
              <path
                d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"
              />
            </svg>
          {/if}
        </h2>

        <Button as="div" title="ШАГ 1 ИЗ 3" appearance="outlined" no_icon>
          <span slot="text">ШАГ 1 ИЗ 3</span>
        </Button>
      </summary>

      <div class="mt-5 md:mt-10">
        <div class="grid md:grid-cols-[0.5fr_1fr] md:gap-7 md:mt-10">
          <label
            for="city"
            hidden={$deliveryStepDone}
            class="text-lg font-medium md:mt-2"
          >
            Город
          </label>

          <div hidden={$deliveryStepDone} class="mt-2 md:mt-0">
            <Select
              name="citycode"
              value={$currentCity.cdek_city_code}
              onChange={onCityChange}
              form="checkout-form"
            >
              <optgroup label="Города рядом с вами">
                {#each closest_cities as { city, code }}
                  <option value={code.toString()}>{city}</option>
                {/each}
              </optgroup>
              <optgroup label="Все города">
                {#each data.cdek_cities as { city, code }}
                  <option value={code.toString()}>{city}</option>
                {/each}
              </optgroup>
            </Select>

            <button
              type="button"
              class="flex ml-4 mt-2 underline text-sm"
              on:click={getCurrentPosition}
            >
              <span>Определить город по моей локации</span>
              <svg
                viewBox="0 0 512 512"
                class="ml-1 w-[1lh] h-[1lh]"
                width="12"
                height="12"
              >
                <path
                  d="M448 64L64 240.14h200a8 8 0 018 8V448z"
                  fill="none"
                  stroke="currentcolor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="32"
                />
              </svg>
            </button>
          </div>

          <label
            for="tk"
            hidden={$deliveryStepDone}
            class="text-lg font-medium mt-6 md:mt-2"
          >
            Транспортная компания
          </label>

          <div hidden={$deliveryStepDone} class="mt-2 md:mt-0">
            <Select name="tk" value="cdek" form="checkout-form">
              <option value="post" disabled>Почта России</option>
              <option value="yandex" disabled>Яндекс</option>
              <option value="cdek" selected>CDEK</option>
            </Select>
          </div>

          <p
            hidden={$deliveryStepDone}
            class="mt-6 md:mt-0 text-lg font-medium"
          >
            Способ доставки
          </p>

          <div hidden={$deliveryStepDone} class="mt-2 md:mt-0">
            <fieldset form="checkout-form">
              <legend class="sr-only">Способ доставки</legend>
              <label class="flex items-center">
                <input
                  type="radio"
                  name="delivery_type"
                  value="courier"
                  checked={$deliveryType === "courier"}
                  form="checkout-form"
                  disabled
                  on:change={() => deliveryType.set("courier")}
                />
                <span class="ml-2">Курьером до двери</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  name="delivery_type"
                  value="pickup"
                  form="checkout-form"
                  checked={$deliveryType === "pickup"}
                  on:change={() => deliveryType.set("pickup")}
                />
                <span class="ml-2">Самовывоз ПВЗ</span>
              </label>
            </fieldset>
          </div>

          {#if $deliveryType === "pickup"}
            {#if !$deliveryStepDone}
              <div id="map" class="aspect-video my-4 md:my-0 md:col-span-2" />
            {/if}

            <div
              class="md:col-span-2 md:grid md:grid-cols-[0.5fr_1fr] md:gap-y-4 md:gap-x-7"
            >
              <p class="text-lg font-medium">ПВЗ</p>

              {#if browser && $deliveryOffice}
                <input
                  type="hidden"
                  name="delivery-address"
                  value={$deliveryOffice.location.address}
                  form="checkout-form"
                />
                <input
                  type="hidden"
                  name="delivery-city"
                  value={data.cdek_cities.find(
                    ({ code }) =>
                      $currentCity.cdek_city_code === code.toString()
                  )?.city}
                  form="checkout-form"
                />

                <p class="text-lg">{$deliveryOffice.owner_code}</p>

                <p class="mt-2 md:mt-0 text-base font-medium">Улица</p>
                <p class="mt-1 md:mt-0">{$deliveryOffice.location.address}</p>

                {#if $deliveryOffice.nearest_station}
                  <p class="mt-2 md:mt-0 text-base font-medium">Остановка</p>
                  <p class="mt-1 md:mt-0">{$deliveryOffice.nearest_station}</p>
                {/if}

                <p class="mt-2 md:mt-0 text-base font-medium">График работы</p>
                <p class="mt-1 md:mt-0">{$deliveryOffice.work_time}</p>

                <p class="mt-2 md:mt-0 text-base font-medium">Контакты</p>
                <p class="mt-1 md:mt-0">
                  {#each $deliveryOffice.phones as { number }}
                    <a href="tel:{number}" class="block">{number}</a>
                  {/each}
                </p>

                {#if $deliveryOffice.address_comment}
                  <p class="mt-2 md:mt-0 text-base font-medium">
                    Как добраться
                  </p>
                  <p class="mt-1 md:mt-0">{$deliveryOffice.address_comment}</p>
                {/if}

                {#if $deliveryDateAndPrice}
                  <p class="mt-2 md:mt-0 text-base font-medium">
                    Срок доставки
                  </p>
                  <p class="mt-1 md:mt-0">
                    От {$deliveryDateAndPrice.calendar_min} до {$deliveryDateAndPrice.calendar_max}
                    календарных дней.
                    <br />
                    Мы пришлем вам трек номер по которому можно будет отследить заказ.
                  </p>

                  <p class="mt-2 md:mt-0 text-base font-medium">
                    Стоимость доставки
                  </p>

                  <p class="mt-1 md:mt-0">
                    {$deliveryDateAndPrice.total_sum.toLocaleString("ru-RU") +
                      " ₽"}
                  </p>
                {/if}

                <div />

                {#if $deliveryStepDone}
                  <p class="mt-2 md:mt-0">
                    <button
                      class="underline"
                      type="button"
                      on:click={() => deliveryStepDone.set(false)}
                    >
                      Изменить
                    </button>
                  </p>
                {:else}
                  <p class="mt-2 md:mt-0">
                    <Button
                      type="button"
                      title="Заберу здесь"
                      handler={() => deliveryStepDone.set(true)}
                      no_icon
                    >
                      <span slot="text">Заберу здесь</span>
                    </Button>
                  </p>
                {/if}
              {:else}
                <p class="mt-4 md:mt-0">Выберите ПВЗ на карте</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </details>

    <details
      class="mt-10"
      class:disabled={!$deliveryStepDone}
      open={$deliveryStepDone}
    >
      <summary
        class="relative flex items-center justify-between pointer-events-none"
      >
        <h2 class="flex items-center text-2xl font-bold">
          <span>Получатель</span>

          {#if $userInfoStepDone}
            <svg
              class="w-[1lh] h-[1lh] ml-3 text-emerald-700"
              viewBox="0 0 512 512"
              aria-hidden="true"
              fill="currentcolor"
            >
              <path
                d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"
              />
            </svg>
          {/if}
        </h2>

        <Button as="div" title="ШАГ 2 ИЗ 3" appearance="outlined" no_icon>
          <span slot="text">ШАГ 2 ИЗ 3</span>
        </Button>
      </summary>

      <div class="mt-5 md:mt-10">
        <form
          method="POST"
          action="?/proceed"
          id="checkout-form"
          class="md:grid md:grid-cols-[0.5fr_1fr] md:gap-7"
          autocomplete="on"
          enctype="multipart/form-data"
          use:enhance
        >
          <label for="full_name" class="text-lg font-medium mt-2"> ФИО </label>
          <div class="mt-2 md:mt-0">
            <input
              type="text"
              id="full_name"
              name={$userInputData["fullname"].name}
              bind:value={$userInputData["fullname"].data}
              maxlength="300"
              placeholder="Иванов Иван Иванович"
              autocomplete="name"
              autocapitalize="words"
              required
              on:input={validateInput}
            />
          </div>

          <label for="phone" class="block mt-6 md:mt-2 text-lg font-medium">
            Телефон
          </label>
          <div class="mt-2 md:mt-0">
            <input
              type="tel"
              id="phone"
              name={$userInputData["phone"].name}
              bind:value={$userInputData["phone"].data}
              pattern={"7[0-9]{10}"}
              minlength="11"
              maxlength="11"
              autocomplete="tel"
              required
              on:input={validateInput}
            />
            <small class="text-xs mt-2 md:ml-4">Формат: 79998887766</small>
          </div>

          <label for="email" class="block mt-6 md:mt-2 text-lg font-medium">
            Email
          </label>
          <div class="mt-2 md:mt-0">
            <input
              type="email"
              id="email"
              name={$userInputData["email"].name}
              bind:value={$userInputData["email"].data}
              placeholder="example@gmail.com"
              autocomplete="email"
              required
              on:input={validateInput}
            />
            <small class="text-xs mt-2 md:ml-4"
              >Необходим для отправки чека.</small
            >
          </div>

          <label
            for="social-network"
            class="block mt-6 md:mt-2 text-lg font-medium"
          >
            Способ связи
          </label>

          <div class="mt-2 md:mt-0">
            <div class="grid grid-cols-2">
              <div class="relative row-start-1 col-start-1 w-36">
                <Select name="social-network" form="checkout-form">
                  <optgroup label="Предпочитаемая соц. сеть">
                    <option value="tg">Телеграм</option>
                    <option value="wa">WhatsApp</option>
                    <option value="inst">Instagram</option>
                  </optgroup>
                </Select>
              </div>

              <input
                type="text"
                name="nickname"
                placeholder="никнейм"
                class="row-start-1 col-start-1 col-end-3 pl-[9.5rem]"
              />
            </div>

            <p class="text-xs mt-2 md:ml-4">
              Можно не указывать, тогда трек номер пришлем на почту.
            </p>
          </div>

          <div />

          <div class="mt-6 md:mt-0">
            <label>
              <input
                type="checkbox"
                name="agree"
                value="yes"
                on:change={validateCheckbox}
              />
              <span
                >Соглашаюсь с <a href="/docs/privacy-policy" class="underline"
                  >политикой обработки персональных данных</a
                ></span
              >
            </label>
          </div>
        </form>
      </div>
    </details>

    <details
      class="mt-10"
      class:disabled={!$userInfoStepDone}
      open={$userInfoStepDone}
    >
      <summary
        class="relative flex items-center justify-between pointer-events-none"
      >
        <h2 class="text-2xl font-bold">Оплата</h2>

        <Button as="div" title="ШАГ 3 ИЗ 3" appearance="outlined" no_icon>
          <span slot="text">ШАГ 3 ИЗ 3</span>
        </Button>
      </summary>

      {#if innerWidth < 600}
        <div class="mt-5">
          <h3 class="font-semibold">Ваш заказ</h3>

          <ul class="space-y-7 mt-4">
            {#each data.order_items as order_item (order_item.id)}
              <li>
                <OrderItem {order_item} />
              </li>
            {/each}
          </ul>

          <div class="total grid grid-cols-2 justify-items-end gap-4 mt-10">
            {#if $deliveryOffice && $deliveryDateAndPrice}
              <h3 class="font-semibold">Стоимость доставки</h3>
              <p class="font-semibold">
                {$deliveryDateAndPrice.total_sum.toLocaleString("ru-RU") + " ₽"}
              </p>
            {/if}

            <h3 class="text-xl font-semibold">Итого</h3>
            <p class="text-xl font-semibold">
              {total.toLocaleString("ru-RU") + " ₽"}
            </p>
          </div>
        </div>
      {/if}

      <div class="ml-auto max-w-max mt-5">
        <input
          type="hidden"
          name="paid_delivery"
          value={$deliveryDateAndPrice?.total_sum}
          form="checkout-form"
        />
        <input
          type="hidden"
          name="paid_total"
          value={total}
          form="checkout-form"
        />

        <Button type="submit" form="checkout-form" title="Оплатить">
          <span slot="text">Оплатить</span>
        </Button>
      </div>

      {#if form?.message}
        <p class="ml-auto max-w-max mt-2 text-red-700">
          {form?.message}
        </p>
      {/if}
    </details>
  </div>

  {#if innerWidth > 600}
    <div>
      <h3 class="font-semibold">Ваш заказ</h3>

      <ul class="space-y-7 mt-4">
        {#each data.order_items as order_item (order_item.id)}
          <li>
            <OrderItem {order_item} />
          </li>
        {/each}
      </ul>

      <div class="total grid grid-cols-2 justify-items-end gap-4 mt-10">
        {#if $deliveryOffice && $deliveryDateAndPrice}
          <h3 class="font-semibold">Стоимость доставки</h3>
          <p class="font-semibold">
            {$deliveryDateAndPrice.total_sum.toLocaleString("ru-RU") + " ₽"}
          </p>
        {/if}

        <h3 class="text-xl font-semibold">Итого</h3>
        <p class="text-xl font-semibold">
          {total.toLocaleString("ru-RU") + " ₽"}
        </p>
      </div>

      <small class="block text-sm mt-4">
        Если вы случайно перезагрузите страницу, то введенная информация все
        равно сохранится.
      </small>
    </div>
  {/if}
</div>

<style>
  :global(.map-cdek-marker) {
    border-radius: 9999px;
    background-image: url("/cdek-logo.svg");
    background-color: var(--accent-color);
    background-repeat: no-repeat;
    background-position: center;
    background-size: 70%;
  }

  details.disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  .total > *:nth-child(odd) {
    justify-self: start;
  }

  input[name="nickname"] {
    @apply pl-40;
  }

  details.order-details-mobile[open] summary img {
    visibility: hidden;
  }

  details.order-details-mobile[open] summary svg.chevron {
    transform: rotate(90deg);
  }
</style>

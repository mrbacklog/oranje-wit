const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";

export function navajoHeaders(entity: string, token: string, instance = "KNKV") {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": instance,
    "X-Navajo-Locale": "nl",
  };
}

export async function navajoGet<T>(
  entity: string,
  token: string,
  params?: Record<string, string>
): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${NAVAJO_BASE}/${entity}${qs}`, {
    headers: navajoHeaders(entity, token),
  });
  const data = await res.json();
  if (data.Error) throw new Error(`Sportlink API fout (${entity}): ${data.Message}`);
  return data as T;
}

export async function navajoPost<T>(entity: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: navajoHeaders(entity, token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.Error) throw new Error(`Sportlink API fout (${entity}): ${data.Message}`);
  return data as T;
}

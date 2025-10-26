export interface Stok {
    durum: "in_stock" | "out_of_stock"
    adet: number
}

export interface BasePart {
    id: string
    ad: string
    fiyat_try: number
    stok: Stok
}

export interface CPU extends BasePart {
    soket: string
    nesil: string
    tdp_w: number
    bellek_destek: {
        tip: "DDR4" | "DDR5"
    }
}

export interface Motherboard extends BasePart {
    form_factor: "ATX" | "Micro-ATX" | "Mini-ITX"
    soket: string
    cpu_uyumluluk: {
        nesiller: string[]
    }
    bellek: {
        tip: "DDR4" | "DDR5"
    }
}

export interface RAM extends BasePart {
    tip: "DDR4" | "DDR5"
    kapasite_gb: number
    hiz_mhz: number
}

export interface GPU extends BasePart {
    boyut: {
        uzunluk_mm: number
    }
    guc: {
        tgp_w: number
        onerilen_psu_w: number
        ek_guc_baglantisi: string[]
    }
}

export interface Cooler extends BasePart {
    tip: "Air" | "Liquid";
    yukseklik_mm: number | null
    radyator_mm: number | null
    desteklenen_soketler: string[]
    max_tdp_w: number
}

export interface Storage extends BasePart {
    form_factor: string
    arayuz: {
        tip: "SATA" | "PCIe"
    }
}

export interface Case extends BasePart {
    mobo_destek: string[]
    gpu_uzunluk_max_mm: number
    cpu_sogutucu_yukseklik_max_mm: number
    psu_destek: string[]
    radyator_destek: {
        front: number[]
        top: number[]
        rear: number[]
    }
}

export interface PSU extends BasePart {
    guc_w: number
    form_factor: string
    baglantilar: {
        pcie_8pin_adet: number
        pcie_12pin_adet: number
    }
}

export interface Monitor extends BasePart {}
export interface Keyboard extends BasePart {}
export interface Mouse extends BasePart {}


export interface SelectedParts {
    cpu: CPU | null
    motherboard: Motherboard | null
    ram: RAM | null
    gpu: GPU | null
    cooler: Cooler | null
    storage: Storage | null
    case: Case | null
    psu: PSU | null
    monitor: Monitor | null
    keyboard: Keyboard | null
    mouse: Mouse | null
}
package com.ikea.server.model;

/** Breadcrumb info for a product: owning category name + href. */
public record CategoryRef(String name, String href) {}

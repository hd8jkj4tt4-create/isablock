// Esempi precaricati. Ogni voce e' lo stato serializzato di un workspace
// Blockly (lo stesso formato salvato da persistence.js), cosi' caricarli
// usa esattamente lo stesso percorso di codice del caricamento di un file
// salvato dallo studente. Generato con uno script headless a partire
// dalle stesse definizioni di blocco in src/blocks/blocks.js, cosi' non
// puo' desincronizzarsi dai blocchi reali.
export const examples = [
  {
    id: 'massimo-due-numeri',
    title: 'Massimo tra due numeri',
    description: 'Legge due numeri e stampa il maggiore.',
    workspaceState: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'program',
            id: 'p_program',
            x: 0,
            y: 0,
            inputs: {
              BODY: {
                block: { type: 'comment_line', id: 'p_comment_intro', fields: { TEXT: 'Legge i due numeri da confrontare' }, next: { block: {
                  type: 'read',
                  id: 'p_read_a',
                  fields: { VAR: { id: 'var_a' } },
                  next: {
                    block: {
                      type: 'read',
                      id: 'p_read_b',
                      fields: { VAR: { id: 'var_b' } },
                      next: {
                        block: { type: 'comment_line', id: 'p_comment_if', fields: { TEXT: 'Confronta i due numeri e stampa il maggiore' }, next: { block: {
                          type: 'controls_if_else',
                          id: 'p_if',
                          inputs: {
                            COND: {
                              block: {
                                type: 'compare_op',
                                id: 'p_cmp',
                                fields: { OP: 'GT' },
                                inputs: {
                                  A: { block: { type: 'variable_get', id: 'p_get_a1', fields: { VAR: { id: 'var_a' } } } },
                                  B: { block: { type: 'variable_get', id: 'p_get_b1', fields: { VAR: { id: 'var_b' } } } },
                                },
                              },
                            },
                            THEN: {
                              block: {
                                type: 'write',
                                id: 'p_write_a',
                                inputs: { VALUE: { block: { type: 'variable_get', id: 'p_get_a2', fields: { VAR: { id: 'var_a' } } } } },
                              },
                            },
                            ELSE: {
                              block: {
                                type: 'write',
                                id: 'p_write_b',
                                inputs: { VALUE: { block: { type: 'variable_get', id: 'p_get_b2', fields: { VAR: { id: 'var_b' } } } } },
                              },
                            },
                          },
                        } } },
                      },
                    },
                  },
                } } },
              },
            },
          },
        ],
      },
      variables: [
        { name: 'a', id: 'var_a' },
        { name: 'b', id: 'var_b' },
      ],
    },
  },
  {
    id: 'somma-sequenza',
    title: 'Somma di una sequenza',
    description: 'Legge N numeri, uno alla volta, e stampa la loro somma.',
    workspaceState: {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "program",
            "id": "p_program",
            "x": 0,
            "y": 0,
            "inputs": {
              "BODY": {
                "block": { "type": "comment_line", "id": "b_comment_read_n", "fields": { "TEXT": "Chiede quanti numeri sommare" }, "next": { "block": {
                  "type": "read",
                  "id": "b_read_n",
                  "fields": {
                    "VAR": {
                      "id": "var_n"
                    }
                  },
                  "next": {
                    "block": { "type": "comment_line", "id": "b_comment_init_somma", "fields": { "TEXT": "La somma parte da zero" }, "next": { "block": {
                      "type": "assign",
                      "id": "b_init_somma",
                      "fields": {
                        "VAR": {
                          "id": "var_somma"
                        }
                      },
                      "inputs": {
                        "VALUE": {
                          "block": {
                            "type": "number_literal",
                            "id": "b_zero",
                            "fields": {
                              "VALUE": 0
                            }
                          }
                        }
                      },
                      "next": {
                        "block": { "type": "comment_line", "id": "b_comment_for", "fields": { "TEXT": "Legge un numero alla volta e lo aggiunge alla somma" }, "next": { "block": {
                          "type": "controls_for_simple",
                          "id": "b_for",
                          "fields": {
                            "VAR": {
                              "id": "var_i"
                            }
                          },
                          "inputs": {
                            "FROM": {
                              "block": {
                                "type": "number_literal",
                                "id": "b_from",
                                "fields": {
                                  "VALUE": 1
                                }
                              }
                            },
                            "TO": {
                              "block": {
                                "type": "variable_get",
                                "id": "b_to",
                                "fields": {
                                  "VAR": {
                                    "id": "var_n"
                                  }
                                }
                              }
                            },
                            "BODY": {
                              "block": {
                                "type": "read",
                                "id": "b_read_valore",
                                "fields": {
                                  "VAR": {
                                    "id": "var_valore"
                                  }
                                },
                                "next": {
                                  "block": {
                                    "type": "assign",
                                    "id": "b_add_somma",
                                    "fields": {
                                      "VAR": {
                                        "id": "var_somma"
                                      }
                                    },
                                    "inputs": {
                                      "VALUE": {
                                        "block": {
                                          "type": "arith_op",
                                          "id": "b_add",
                                          "fields": {
                                            "OP": "ADD"
                                          },
                                          "inputs": {
                                            "A": {
                                              "block": {
                                                "type": "variable_get",
                                                "id": "b_somma_get",
                                                "fields": {
                                                  "VAR": {
                                                    "id": "var_somma"
                                                  }
                                                }
                                              }
                                            },
                                            "B": {
                                              "block": {
                                                "type": "variable_get",
                                                "id": "b_valore_get",
                                                "fields": {
                                                  "VAR": {
                                                    "id": "var_valore"
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "write",
                              "id": "b_write_somma",
                              "inputs": {
                                "VALUE": {
                                  "block": {
                                    "type": "variable_get",
                                    "id": "b_somma_get2",
                                    "fields": {
                                      "VAR": {
                                        "id": "var_somma"
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } } }
                      }
                    } } }
                  }
                } } }
              }
            }
          }
        ]
      },
      "variables": [
        {
          "name": "n",
          "id": "var_n"
        },
        {
          "name": "somma",
          "id": "var_somma"
        },
        {
          "name": "i",
          "id": "var_i"
        },
        {
          "name": "valore",
          "id": "var_valore"
        }
      ]
    },
  },
  {
    id: 'ricerca-lineare',
    title: 'Ricerca lineare',
    description: 'Cerca un valore tra N numeri letti in input, uno alla volta, e stampa la posizione in cui lo trova (0 se non lo trova).',
    workspaceState: {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "program",
            "id": "p_program",
            "x": 0,
            "y": 0,
            "inputs": {
              "BODY": {
                "block": { "type": "comment_line", "id": "b_comment_read_n", "fields": { "TEXT": "Legge quanti numeri ci sono nella sequenza" }, "next": { "block": {
                  "type": "read",
                  "id": "b_read_n",
                  "fields": {
                    "VAR": {
                      "id": "var_n"
                    }
                  },
                  "next": {
                    "block": { "type": "comment_line", "id": "b_comment_read_target", "fields": { "TEXT": "Legge il valore da cercare" }, "next": { "block": {
                      "type": "read",
                      "id": "b_read_target",
                      "fields": {
                        "VAR": {
                          "id": "var_target"
                        }
                      },
                      "next": {
                        "block": { "type": "comment_line", "id": "b_comment_init_pos", "fields": { "TEXT": "Posizione a 0 significa che non è stato ancora trovato" }, "next": { "block": {
                          "type": "assign",
                          "id": "b_init_pos",
                          "fields": {
                            "VAR": {
                              "id": "var_posizione"
                            }
                          },
                          "inputs": {
                            "VALUE": {
                              "block": {
                                "type": "number_literal",
                                "id": "b_zero1",
                                "fields": {
                                  "VALUE": 0
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "assign",
                              "id": "b_init_i",
                              "fields": {
                                "VAR": {
                                  "id": "var_i"
                                }
                              },
                              "inputs": {
                                "VALUE": {
                                  "block": {
                                    "type": "number_literal",
                                    "id": "b_one1",
                                    "fields": {
                                      "VALUE": 1
                                    }
                                  }
                                }
                              },
                              "next": {
                                "block": { "type": "comment_line", "id": "b_comment_while", "fields": { "TEXT": "Scorre i numeri finché non trova il valore cercato o li ha controllati tutti" }, "next": { "block": {
                                  "type": "controls_while",
                                  "id": "b_while",
                                  "inputs": {
                                    "COND": {
                                      "block": {
                                        "type": "logic_op",
                                        "id": "b_and",
                                        "fields": {
                                          "OP": "AND"
                                        },
                                        "inputs": {
                                          "A": {
                                            "block": {
                                              "type": "compare_op",
                                              "id": "b_lte",
                                              "fields": {
                                                "OP": "LTE"
                                              },
                                              "inputs": {
                                                "A": {
                                                  "block": {
                                                    "type": "variable_get",
                                                    "id": "b_i_get1",
                                                    "fields": {
                                                      "VAR": {
                                                        "id": "var_i"
                                                      }
                                                    }
                                                  }
                                                },
                                                "B": {
                                                  "block": {
                                                    "type": "variable_get",
                                                    "id": "b_n_get1",
                                                    "fields": {
                                                      "VAR": {
                                                        "id": "var_n"
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          },
                                          "B": {
                                            "block": {
                                              "type": "compare_op",
                                              "id": "b_eq_zero",
                                              "fields": {
                                                "OP": "EQ"
                                              },
                                              "inputs": {
                                                "A": {
                                                  "block": {
                                                    "type": "variable_get",
                                                    "id": "b_pos_get1",
                                                    "fields": {
                                                      "VAR": {
                                                        "id": "var_posizione"
                                                      }
                                                    }
                                                  }
                                                },
                                                "B": {
                                                  "block": {
                                                    "type": "number_literal",
                                                    "id": "b_zero2",
                                                    "fields": {
                                                      "VALUE": 0
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    },
                                    "BODY": {
                                      "block": {
                                        "type": "read",
                                        "id": "b_read_valore",
                                        "fields": {
                                          "VAR": {
                                            "id": "var_valore"
                                          }
                                        },
                                        "next": {
                                          "block": { "type": "comment_line", "id": "b_comment_if_eq", "fields": { "TEXT": "Se il valore letto è quello cercato, memorizza la posizione" }, "next": { "block": {
                                            "type": "controls_if_simple",
                                            "id": "b_if_eq",
                                            "inputs": {
                                              "COND": {
                                                "block": {
                                                  "type": "compare_op",
                                                  "id": "b_eq_target",
                                                  "fields": {
                                                    "OP": "EQ"
                                                  },
                                                  "inputs": {
                                                    "A": {
                                                      "block": {
                                                        "type": "variable_get",
                                                        "id": "b_valore_get",
                                                        "fields": {
                                                          "VAR": {
                                                            "id": "var_valore"
                                                          }
                                                        }
                                                      }
                                                    },
                                                    "B": {
                                                      "block": {
                                                        "type": "variable_get",
                                                        "id": "b_target_get",
                                                        "fields": {
                                                          "VAR": {
                                                            "id": "var_target"
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              },
                                              "THEN": {
                                                "block": {
                                                  "type": "assign",
                                                  "id": "b_set_pos",
                                                  "fields": {
                                                    "VAR": {
                                                      "id": "var_posizione"
                                                    }
                                                  },
                                                  "inputs": {
                                                    "VALUE": {
                                                      "block": {
                                                        "type": "variable_get",
                                                        "id": "b_i_get2",
                                                        "fields": {
                                                          "VAR": {
                                                            "id": "var_i"
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            },
                                            "next": {
                                              "block": {
                                                "type": "assign",
                                                "id": "b_inc_i",
                                                "fields": {
                                                  "VAR": {
                                                    "id": "var_i"
                                                  }
                                                },
                                                "inputs": {
                                                  "VALUE": {
                                                    "block": {
                                                      "type": "arith_op",
                                                      "id": "b_add_i",
                                                      "fields": {
                                                        "OP": "ADD"
                                                      },
                                                      "inputs": {
                                                        "A": {
                                                          "block": {
                                                            "type": "variable_get",
                                                            "id": "b_i_get3",
                                                            "fields": {
                                                              "VAR": {
                                                                "id": "var_i"
                                                              }
                                                            }
                                                          }
                                                        },
                                                        "B": {
                                                          "block": {
                                                            "type": "number_literal",
                                                            "id": "b_one2",
                                                            "fields": {
                                                              "VALUE": 1
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          } } }
                                        }
                                      }
                                    }
                                  },
                                  "next": {
                                    "block": {
                                      "type": "write",
                                      "id": "b_write_pos",
                                      "inputs": {
                                        "VALUE": {
                                          "block": {
                                            "type": "variable_get",
                                            "id": "b_pos_get2",
                                            "fields": {
                                              "VAR": {
                                                "id": "var_posizione"
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                } } }
                              }
                            }
                          }
                        } } }
                      }
                    } } }
                  }
                } } }
              }
            }
          }
        ]
      },
      "variables": [
        {
          "name": "n",
          "id": "var_n"
        },
        {
          "name": "target",
          "id": "var_target"
        },
        {
          "name": "i",
          "id": "var_i"
        },
        {
          "name": "posizione",
          "id": "var_posizione"
        },
        {
          "name": "valore",
          "id": "var_valore"
        }
      ]
    },
  },
  {
    id: 'fattoriale',
    title: 'Fattoriale',
    description: 'Calcola il fattoriale di un numero letto in input.',
    workspaceState: {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "program",
            "id": "p_program",
            "x": 0,
            "y": 0,
            "inputs": {
              "BODY": {
                "block": {
                  "type": "read",
                  "id": "b_read_n",
                  "fields": {
                    "VAR": {
                      "id": "var_n"
                    }
                  },
                  "next": {
                    "block": { "type": "comment_line", "id": "b_comment_init_fatt", "fields": { "TEXT": "Il fattoriale parte da 1" }, "next": { "block": {
                      "type": "assign",
                      "id": "b_init_fatt",
                      "fields": {
                        "VAR": {
                          "id": "var_fattoriale"
                        }
                      },
                      "inputs": {
                        "VALUE": {
                          "block": {
                            "type": "number_literal",
                            "id": "b_one",
                            "fields": {
                              "VALUE": 1
                            }
                          }
                        }
                      },
                      "next": {
                        "block": { "type": "comment_line", "id": "b_comment_for", "fields": { "TEXT": "Moltiplica via via per ogni numero da 1 a n" }, "next": { "block": {
                          "type": "controls_for_simple",
                          "id": "b_for",
                          "fields": {
                            "VAR": {
                              "id": "var_i"
                            }
                          },
                          "inputs": {
                            "FROM": {
                              "block": {
                                "type": "number_literal",
                                "id": "b_from",
                                "fields": {
                                  "VALUE": 1
                                }
                              }
                            },
                            "TO": {
                              "block": {
                                "type": "variable_get",
                                "id": "b_to",
                                "fields": {
                                  "VAR": {
                                    "id": "var_n"
                                  }
                                }
                              }
                            },
                            "BODY": {
                              "block": {
                                "type": "assign",
                                "id": "b_mul_assign",
                                "fields": {
                                  "VAR": {
                                    "id": "var_fattoriale"
                                  }
                                },
                                "inputs": {
                                  "VALUE": {
                                    "block": {
                                      "type": "arith_op",
                                      "id": "b_mul",
                                      "fields": {
                                        "OP": "MUL"
                                      },
                                      "inputs": {
                                        "A": {
                                          "block": {
                                            "type": "variable_get",
                                            "id": "b_fatt_get",
                                            "fields": {
                                              "VAR": {
                                                "id": "var_fattoriale"
                                              }
                                            }
                                          }
                                        },
                                        "B": {
                                          "block": {
                                            "type": "variable_get",
                                            "id": "b_i_get",
                                            "fields": {
                                              "VAR": {
                                                "id": "var_i"
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "write",
                              "id": "b_write_fatt",
                              "inputs": {
                                "VALUE": {
                                  "block": {
                                    "type": "variable_get",
                                    "id": "b_fatt_get2",
                                    "fields": {
                                      "VAR": {
                                        "id": "var_fattoriale"
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        } } }
                      }
                    } } }
                  }
                }
              }
            }
          }
        ]
      },
      "variables": [
        {
          "name": "n",
          "id": "var_n"
        },
        {
          "name": "fattoriale",
          "id": "var_fattoriale"
        },
        {
          "name": "i",
          "id": "var_i"
        }
      ]
    },
  },
  {
    id: 'primalita',
    title: 'Verifica di primalità elementare',
    description: 'Controlla se un numero letto in input è primo, provando tutti i possibili divisori.',
    workspaceState: {
      "blocks": {
        "languageVersion": 0,
        "blocks": [
          {
            "type": "program",
            "id": "p_program",
            "x": 0,
            "y": 0,
            "inputs": {
              "BODY": {
                "block": {
                  "type": "read",
                  "id": "b_read_n",
                  "fields": {
                    "VAR": {
                      "id": "var_n"
                    }
                  },
                  "next": {
                    "block": { "type": "comment_line", "id": "b_comment_init_i", "fields": { "TEXT": "Si parte a controllare dal primo possibile divisore, cioè 2" }, "next": { "block": {
                      "type": "assign",
                      "id": "b_init_i",
                      "fields": {
                        "VAR": {
                          "id": "var_i"
                        }
                      },
                      "inputs": {
                        "VALUE": {
                          "block": {
                            "type": "number_literal",
                            "id": "b_two",
                            "fields": {
                              "VALUE": 2
                            }
                          }
                        }
                      },
                      "next": {
                        "block": {
                          "type": "assign",
                          "id": "b_init_primo",
                          "fields": {
                            "VAR": {
                              "id": "var_primo"
                            }
                          },
                          "inputs": {
                            "VALUE": {
                              "block": {
                                "type": "number_literal",
                                "id": "b_one1",
                                "fields": {
                                  "VALUE": 1
                                }
                              }
                            }
                          },
                          "next": {
                            "block": { "type": "comment_line", "id": "b_comment_while", "fields": { "TEXT": "Prova tutti i possibili divisori minori di n" }, "next": { "block": {
                              "type": "controls_while",
                              "id": "b_while",
                              "inputs": {
                                "COND": {
                                  "block": {
                                    "type": "compare_op",
                                    "id": "b_lt",
                                    "fields": {
                                      "OP": "LT"
                                    },
                                    "inputs": {
                                      "A": {
                                        "block": {
                                          "type": "variable_get",
                                          "id": "b_i_get1",
                                          "fields": {
                                            "VAR": {
                                              "id": "var_i"
                                            }
                                          }
                                        }
                                      },
                                      "B": {
                                        "block": {
                                          "type": "variable_get",
                                          "id": "b_n_get1",
                                          "fields": {
                                            "VAR": {
                                              "id": "var_n"
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                },
                                "BODY": {
                                  "block": { "type": "comment_line", "id": "b_comment_if_mod", "fields": { "TEXT": "Se n è divisibile per i, allora n non è primo" }, "next": { "block": {
                                    "type": "controls_if_simple",
                                    "id": "b_if_mod",
                                    "inputs": {
                                      "COND": {
                                        "block": {
                                          "type": "compare_op",
                                          "id": "b_eq_zero",
                                          "fields": {
                                            "OP": "EQ"
                                          },
                                          "inputs": {
                                            "A": {
                                              "block": {
                                                "type": "arith_op",
                                                "id": "b_mod",
                                                "fields": {
                                                  "OP": "MOD"
                                                },
                                                "inputs": {
                                                  "A": {
                                                    "block": {
                                                      "type": "variable_get",
                                                      "id": "b_n_get2",
                                                      "fields": {
                                                        "VAR": {
                                                          "id": "var_n"
                                                        }
                                                      }
                                                    }
                                                  },
                                                  "B": {
                                                    "block": {
                                                      "type": "variable_get",
                                                      "id": "b_i_get2",
                                                      "fields": {
                                                        "VAR": {
                                                          "id": "var_i"
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            },
                                            "B": {
                                              "block": {
                                                "type": "number_literal",
                                                "id": "b_zero",
                                                "fields": {
                                                  "VALUE": 0
                                                }
                                              }
                                            }
                                          }
                                        }
                                      },
                                      "THEN": {
                                        "block": {
                                          "type": "assign",
                                          "id": "b_set_false",
                                          "fields": {
                                            "VAR": {
                                              "id": "var_primo"
                                            }
                                          },
                                          "inputs": {
                                            "VALUE": {
                                              "block": {
                                                "type": "number_literal",
                                                "id": "b_zero_lit",
                                                "fields": {
                                                  "VALUE": 0
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    },
                                    "next": {
                                      "block": {
                                        "type": "assign",
                                        "id": "b_inc_i",
                                        "fields": {
                                          "VAR": {
                                            "id": "var_i"
                                          }
                                        },
                                        "inputs": {
                                          "VALUE": {
                                            "block": {
                                              "type": "arith_op",
                                              "id": "b_add",
                                              "fields": {
                                                "OP": "ADD"
                                              },
                                              "inputs": {
                                                "A": {
                                                  "block": {
                                                    "type": "variable_get",
                                                    "id": "b_i_get3",
                                                    "fields": {
                                                      "VAR": {
                                                        "id": "var_i"
                                                      }
                                                    }
                                                  }
                                                },
                                                "B": {
                                                  "block": {
                                                    "type": "number_literal",
                                                    "id": "b_one2",
                                                    "fields": {
                                                      "VALUE": 1
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } } }
                                }
                              },
                              "next": {
                                "block": { "type": "comment_line", "id": "b_comment_write_result", "fields": { "TEXT": "Stampa 1 se è primo, 0 se non lo è" }, "next": { "block": {
                                  "type": "controls_if_else",
                                  "id": "b_write_result",
                                  "inputs": {
                                    "COND": {
                                      "block": {
                                        "type": "compare_op",
                                        "id": "b_eq_one",
                                        "fields": {
                                          "OP": "EQ"
                                        },
                                        "inputs": {
                                          "A": {
                                            "block": {
                                              "type": "variable_get",
                                              "id": "b_primo_get",
                                              "fields": {
                                                "VAR": {
                                                  "id": "var_primo"
                                                }
                                              }
                                            }
                                          },
                                          "B": {
                                            "block": {
                                              "type": "number_literal",
                                              "id": "b_one_lit",
                                              "fields": {
                                                "VALUE": 1
                                              }
                                            }
                                          }
                                        }
                                      }
                                    },
                                    "THEN": {
                                      "block": {
                                        "type": "write",
                                        "id": "b_w1",
                                        "inputs": {
                                          "VALUE": {
                                            "block": {
                                              "type": "number_literal",
                                              "id": "b_lit_one",
                                              "fields": {
                                                "VALUE": 1
                                              }
                                            }
                                          }
                                        }
                                      }
                                    },
                                    "ELSE": {
                                      "block": {
                                        "type": "write",
                                        "id": "b_w0",
                                        "inputs": {
                                          "VALUE": {
                                            "block": {
                                              "type": "number_literal",
                                              "id": "b_lit_zero",
                                              "fields": {
                                                "VALUE": 0
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                } } }
                              }
                            } } }
                          }
                        }
                      }
                    } } }
                  }
                }
              }
            }
          }
        ]
      },
      "variables": [
        {
          "name": "n",
          "id": "var_n"
        },
        {
          "name": "i",
          "id": "var_i"
        },
        {
          "name": "primo",
          "id": "var_primo"
        }
      ]
    },
  },
];
